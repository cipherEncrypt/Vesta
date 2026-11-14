import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function isPlaceholderKey(key) {
  if (!key) return false;
  const k = key.trim();
  if (k === "ed25519:..." || k === "ed25519:…" || /:\.{2,}$/.test(k)) return true;
  return k.startsWith("ed25519:") && k.length < 45;
}

/** Legacy NEAR CLI JSON paths for a given account (full-access keys only). */
export function loadPrivateKeyFromNearCli(accountId, network = "testnet") {
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
      if (key) return { key, source: file };
    } catch {
      /* next */
    }
  }
  return null;
}

export function loadAgentPrivateKey({ keyFile, envKey }) {
  let secret = envKey?.trim();
  if (isPlaceholderKey(secret)) secret = undefined;

  if (!secret && keyFile && fs.existsSync(keyFile)) {
    const data = JSON.parse(fs.readFileSync(keyFile, "utf8"));
    secret = data.private_key ?? data.privateKey;
    return { key: secret, source: keyFile };
  }

  if (secret) return { key: secret, source: "VESTA_AGENT_PRIVATE_KEY" };
  return null;
}