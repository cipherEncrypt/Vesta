import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { isPlaceholderKey, loadAgentPrivateKey } from "./keys.mjs";

const agentRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export function loadConfig() {
  const ownerAccountId = process.env.VESTA_OWNER_ACCOUNT_ID?.trim();
  const vaultAccountId =
    process.env.VESTA_VAULT_ACCOUNT_ID?.trim() ??
    "dev-7706-30240.cipher22.testnet";

  const keyFile =
    process.env.VESTA_AGENT_KEY_FILE?.trim() ??
    path.join(agentRoot, ".agent-key.json");

  const agentKey = loadAgentPrivateKey({
    keyFile,
    envKey: process.env.VESTA_AGENT_PRIVATE_KEY,
  });

  const saveAmountNear = process.env.VESTA_SAVE_AMOUNT_NEAR?.trim() ?? "0.02";
  const ruleFile =
    process.env.VESTA_RULE_FILE?.trim() ??
    path.join(agentRoot, "data", "rule.json");
  const intervalMs = Number(process.env.VESTA_INTERVAL_MS ?? "86400000");
  const logFile =
    process.env.VESTA_LOG_FILE?.trim() ??
    path.join(agentRoot, "data", "runs.json");

  const networkId = process.env.NEAR_NETWORK_ID?.trim() ?? "testnet";
  const nodeUrl =
    process.env.NEAR_RPC_URL?.trim() ?? "https://rpc.testnet.near.org";

  return {
    ownerAccountId,
    vaultAccountId,
    agentKey,
    saveAmountNear,
    ruleFile,
    intervalMs,
    logFile,
    networkId,
    nodeUrl,
    agentRoot,
  };
}

export function readSaveAmountNear(config) {
  try {
    const rule = JSON.parse(fs.readFileSync(config.ruleFile, "utf8"));
    if (
      typeof rule.saveAmountNear === "string" &&
      Number.isFinite(Number(rule.saveAmountNear)) &&
      Number(rule.saveAmountNear) > 0
    ) {
      return rule.saveAmountNear;
    }
  } catch {
    // No persisted rule yet; the environment/default remains authoritative.
  }
  return config.saveAmountNear;
}

export function assertConfig(config) {
  if (!config.ownerAccountId) {
    throw new Error("Set VESTA_OWNER_ACCOUNT_ID (account that holds the agent function-call key).");
  }
  if (!config.agentKey?.key) {
    throw new Error(
      "No agent signing key. Set VESTA_AGENT_PRIVATE_KEY or create agent/.agent-key.json:\n" +
        '  { "private_key": "ed25519:..." }\n' +
        "Use the function-call key added on the owner account (method auto_save on the vault only).",
    );
  }
  if (isPlaceholderKey(config.agentKey.key)) {
    throw new Error("Agent private key looks like a placeholder — set the real function-call secret key.");
  }
  if (!Number.isFinite(config.intervalMs) || config.intervalMs < 5000) {
    throw new Error("VESTA_INTERVAL_MS must be a number >= 5000");
  }
}