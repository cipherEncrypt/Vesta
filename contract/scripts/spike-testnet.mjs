/**
 * Testnet spike — uses YOUR account (not near-workspaces' random testnet root).
 *
 *   SPIKE_ACCOUNT_ID   e.g. alice.testnet (not the README placeholder "you.testnet")
 *   SPIKE_PRIVATE_KEY  full-access key, e.g. ed25519:5Fg2... (full string from wallet / ~/.near-credentials)
 *   SPIKE_VAULT_ID     optional — skip deploy, use existing vault contract account
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nearAPI from "near-api-js";
import { CustomnetWorker, KeyPair, TESTNET_RPC_ADDR } from "near-workspaces";
import { functionCallAccessKey } from "near-api-js/lib/transaction.js";
import { parseNearAmount } from "near-api-js/lib/utils/format.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WASM = path.join(__dirname, "../target/near/autopilot_vault.wasm");
const TGAS = 30n * 10n ** 12n;
const NETWORK = "custom";

function die(message) {
  console.error(message);
  process.exit(1);
}

function isPlaceholderKey(key) {
  if (!key) return false;
  const k = key.trim();
  if (k === "ed25519:..." || k === "ed25519:…" || /:\.{2,}$/.test(k)) return true;
  // Real NEAR secret keys are long base58 strings after the prefix
  return k.startsWith("ed25519:") && k.length < 45;
}

function loadPrivateKeyFromNearCli(accountId) {
  const network = process.env.SPIKE_NETWORK ?? "testnet";
  const candidates = [
    path.join(os.homedir(), ".near-credentials", network, `${accountId}.json`),
    path.join(os.homedir(), ".near-credentials", `${accountId}.json`),
  ];
  const accountDir = path.join(os.homedir(), ".near-credentials", network, accountId);
  if (fs.existsSync(accountDir)) {
    for (const name of fs.readdirSync(accountDir)) {
      if (name.endsWith(".json")) candidates.push(path.join(accountDir, name));
    }
  }
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    try {
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      const key = data.private_key ?? data.privateKey;
      if (key) {
        console.log(`Using key from ${file}`);
        return key;
      }
    } catch {
      /* try next */
    }
  }
  return null;
}

function validateCredentials(accountId, secretKey) {
  if (!accountId) {
    die(
      "Set SPIKE_ACCOUNT_ID (e.g. cipher22.testnet).\n" +
        "Optionally SPIKE_PRIVATE_KEY, or save a legacy key file under ~/.near-credentials/testnet/",
    );
  }
  if (!secretKey) {
    die(
      "No signing key found.\n" +
        "Your account may use macOS Keychain only (save-to-keychain). Export a JS-readable key:\n\n" +
        "  near account add-key " +
        accountId +
        " grant-full-access autogenerate-new-keypair save-to-legacy-keychain network-config testnet sign-with-keychain send\n\n" +
        "Then either re-run with only SPIKE_ACCOUNT_ID set, or:\n" +
        "  export SPIKE_PRIVATE_KEY=$(jq -r .private_key ~/.near-credentials/testnet/" +
        accountId +
        ".json)",
    );
  }
  if (accountId === "you.testnet") {
    die('Use your real account id (e.g. cipher22.testnet), not the README placeholder "you.testnet".');
  }
  if (isPlaceholderKey(secretKey)) {
    die(
      "SPIKE_PRIVATE_KEY looks like a README placeholder (e.g. ed25519:...).\n" +
        "Run: unset SPIKE_PRIVATE_KEY\n" +
        "Then add a legacy key file with NEAR CLI (see SPIKE.md), or export the full private key.",
    );
  }
  if (!accountId.endsWith(".testnet")) {
    console.warn("Warning: account id does not end with .testnet — is this intentional?");
  }
  if (!secretKey.startsWith("ed25519:") && !secretKey.startsWith("secp256k1:")) {
    die("SPIKE_PRIVATE_KEY should be a NEAR key string starting with ed25519: or secp256k1:");
  }
}

async function expectFailure(promise, label) {
  try {
    await promise;
    throw new Error(`Expected failure: ${label}`);
  } catch (err) {
    if (err?.message?.startsWith("Expected failure:")) throw err;
    console.log(`OK reject (${label}):`, String(err?.message ?? err).slice(0, 200));
  }
}

async function main() {
  const accountId = process.env.SPIKE_ACCOUNT_ID?.trim();
  let secretKey = process.env.SPIKE_PRIVATE_KEY?.trim();
  if (isPlaceholderKey(secretKey)) {
    console.warn("Ignoring placeholder SPIKE_PRIVATE_KEY in environment (unset it: unset SPIKE_PRIVATE_KEY)");
    secretKey = undefined;
  }
  if (accountId && !secretKey) {
    secretKey = loadPrivateKeyFromNearCli(accountId);
  }
  validateCredentials(accountId, secretKey);

  if (!fs.existsSync(WASM)) {
    die("Build WASM first: npm run build:contract");
  }

  const keyPair = KeyPair.fromString(secretKey);
  const keyStore = new nearAPI.keyStores.InMemoryKeyStore();
  await keyStore.setKey(NETWORK, accountId, keyPair);

  const worker = await CustomnetWorker.init({
    network: NETWORK,
    rpcAddr: process.env.SPIKE_RPC ?? TESTNET_RPC_ADDR,
    rootAccountId: accountId,
    keyStore,
  });

  const root = worker.rootAccount;
  const maxPerRun = String(parseNearAmount("0.05"));

  let vault;
  if (process.env.SPIKE_VAULT_ID) {
    vault = root.getAccount(process.env.SPIKE_VAULT_ID);
    const exists = await vault.exists();
    if (!exists) die(`SPIKE_VAULT_ID ${process.env.SPIKE_VAULT_ID} does not exist on testnet`);
    console.log("Reusing vault:", vault.accountId);
  } else {
    vault = await root.devDeploy(WASM, {
      initialBalance: BigInt(parseNearAmount("3")),
    });
    await root.call(vault.accountId, "init", {
      owner: accountId,
      max_per_run: maxPerRun,
    });
    console.log("Deployed vault:", vault.accountId);
  }

  await root.call(vault.accountId, "deposit", {}, {
    attachedDeposit: BigInt(parseNearAmount("0.5")),
    gas: TGAS,
  });

  const agentKey = KeyPair.fromRandom("ed25519");
  await root
    .batch(accountId)
    .addKey(
      agentKey.getPublicKey(),
      functionCallAccessKey(vault.accountId, ["auto_save"]),
    )
    .transact();

  const saveAmount = String(parseNearAmount("0.02"));
  await root.call(
    vault.accountId,
    "auto_save",
    { amount: saveAmount },
    { gas: TGAS, signWithKey: agentKey },
  );
  console.log("OK (a) testnet auto_save");

  await expectFailure(
    root.call(
      vault.accountId,
      "auto_save",
      { amount: String(parseNearAmount("0.2")) },
      { gas: TGAS, signWithKey: agentKey },
    ),
    "over maxPerRun",
  );

  await expectFailure(
    root.call(
      vault.accountId,
      "withdraw",
      { amount: saveAmount },
      { gas: TGAS, signWithKey: agentKey },
    ),
    "withdraw with scoped key",
  );

  if (process.env.VESTA_WRITE_AGENT_KEY === "1") {
    const agentKeyPath = path.join(__dirname, "../../agent/.agent-key.json");
    fs.writeFileSync(
      agentKeyPath,
      `${JSON.stringify({ account_id: accountId, private_key: agentKey.toString() }, null, 2)}\n`,
    );
    console.log("Wrote agent FC secret to", agentKeyPath, "(gitignored)");
  }

  await worker.tearDown();
  console.log("=== SPIKE PASSED (testnet) ===");
  console.log("Vault for demos:", vault.accountId);
  console.log(
    "Tip: re-run with VESTA_WRITE_AGENT_KEY=1 to save the agent key into agent/.agent-key.json",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});