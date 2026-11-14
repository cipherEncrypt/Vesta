/**
 * Step 0 spike (local sandbox): proves
 * (a) valid auto_save works
 * (b) over-cap auto_save fails
 * (c) function-call key limited to auto_save cannot call withdraw
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SandboxWorker, KeyPair } from "near-workspaces";
import { functionCallAccessKey } from "near-api-js/lib/transaction.js";
import { parseNearAmount } from "near-api-js/lib/utils/format.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WASM = path.join(__dirname, "../target/near/autopilot_vault.wasm");

const TGAS = 30n * 10n ** 12n;

function assert(condition, message) {
  if (!condition) {
    console.error("FAIL:", message);
    process.exit(1);
  }
}

async function expectFailure(promise, label) {
  try {
    await promise;
    console.error(`FAIL: expected rejection for ${label}`);
    process.exit(1);
  } catch (err) {
    const msg = String(err?.message ?? err);
    console.log(`OK reject (${label}):`, msg.slice(0, 120));
    return msg;
  }
}

async function main() {
  if (!fs.existsSync(WASM)) {
    console.error("Build WASM first: npm run build -w contract");
    process.exit(1);
  }

  const worker = await SandboxWorker.init({});
  const root = worker.rootAccount;

  const maxPerRun = String(parseNearAmount("0.5"));
  const depositAmount = String(parseNearAmount("2"));

  const owner = await root.createSubAccount("owner");
  const vault = await root.devDeploy(WASM, {});
  await root.call(vault.accountId, "init", {
    owner: owner.accountId,
    max_per_run: maxPerRun,
  });

  console.log("Vault:", vault.accountId, "Owner:", owner.accountId);

  await owner.call(vault.accountId, "deposit", {}, {
    attachedDeposit: BigInt(depositAmount),
    gas: TGAS,
  });

  const stateAfterDeposit = await vault.view("get_state");
  console.log("After deposit:", stateAfterDeposit);
  assert(stateAfterDeposit.spending === depositAmount, "spending should match deposit");

  const agentKey = KeyPair.fromRandom("ed25519");
  await owner
    .batch(owner.accountId)
    .addKey(
      agentKey.getPublicKey(),
      functionCallAccessKey(vault.accountId, ["auto_save"]),
    )
    .transact();

  const saveAmount = String(parseNearAmount("0.2"));
  await owner.call(
    vault.accountId,
    "auto_save",
    { amount: saveAmount },
    { gas: TGAS, signWithKey: agentKey },
  );

  const stateAfterSave = await vault.view("get_state");
  console.log("After auto_save:", stateAfterSave);
  assert(stateAfterSave.savings === saveAmount, "savings should reflect auto_save");
  console.log("OK (a): valid auto_save");

  await expectFailure(
    owner.call(
      vault.accountId,
      "auto_save",
      { amount: String(parseNearAmount("1")) },
      { gas: TGAS, signWithKey: agentKey },
    ),
    "over maxPerRun",
  );
  console.log("OK (b): over-cap auto_save rejected");

  await expectFailure(
    owner.call(
      vault.accountId,
      "withdraw",
      { amount: String(parseNearAmount("0.1")) },
      { gas: TGAS, signWithKey: agentKey },
    ),
    "withdraw with function-call key",
  );
  console.log("OK (c): agent key cannot withdraw");

  await worker.tearDown();
  console.log("\n=== SPIKE PASSED (sandbox) ===");
  console.log("Run npm run spike:testnet with NEAR testnet credentials for on-chain proof.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
