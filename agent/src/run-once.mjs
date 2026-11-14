import { formatNearAmount } from "near-api-js/lib/utils/format.js";
import { loadConfig, assertConfig, readSaveAmountNear } from "./config.mjs";
import { appendRun } from "./log.mjs";
import {
  connectAgent,
  viewVaultState,
  pickSaveAmountYocto,
  callAutoSave,
  txHashFromOutcome,
} from "./near-client.mjs";

export async function executeAutoSaveOnce(configIn) {
  const config = configIn ?? loadConfig();
  assertConfig(config);

  const { account } = await connectAgent({
    networkId: config.networkId,
    nodeUrl: config.nodeUrl,
    ownerAccountId: config.ownerAccountId,
    agentPrivateKey: config.agentKey.key,
  });

  const stateBefore = await viewVaultState(account, config.vaultAccountId);
  const amountYocto = pickSaveAmountYocto(
    stateBefore,
    readSaveAmountNear(config),
  );

  if (!amountYocto) {
    const entry = {
      timestamp: new Date().toISOString(),
      skipped: true,
      reason: "no spendable balance or amount is zero",
      amount: "0",
      txHash: null,
      state: stateBefore,
    };
    console.log("[vesta-agent] skip:", entry.reason);
    return entry;
  }

  console.log(
    `[vesta-agent] auto_save ${formatNearAmount(amountYocto)} NEAR → ${config.vaultAccountId}`,
  );

  const outcome = await callAutoSave(account, config.vaultAccountId, amountYocto);
  const stateAfter = await viewVaultState(account, config.vaultAccountId);
  const txHash = txHashFromOutcome(outcome);

  const entry = {
    timestamp: new Date().toISOString(),
    skipped: false,
    amount: amountYocto,
    txHash,
    state: stateAfter,
  };
  appendRun(config.logFile, entry);
  console.log(`[vesta-agent] ok tx=${txHash ?? "unknown"}`);
  return entry;
}