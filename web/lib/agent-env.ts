import fs from "node:fs";
import path from "node:path";
import { agentPackageRoot } from "@/lib/agent-root";
import { NODE_URL, VAULT_CONTRACT_ID } from "@/lib/constants";

function applyDotEnvFile(env: NodeJS.ProcessEnv, filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (env[key] === undefined || env[key] === "") {
      env[key] = value;
    }
  }
}

/** Env for spawning the agent CLI from the Next.js server (demo defaults + agent/.env). */
export function agentProcessEnv(): NodeJS.ProcessEnv {
  const root = agentPackageRoot();
  const env = { ...process.env };

  applyDotEnvFile(env, path.join(root, ".env"));

  env.VESTA_OWNER_ACCOUNT_ID ??= "cipher22.testnet";
  env.VESTA_VAULT_ACCOUNT_ID ??= VAULT_CONTRACT_ID;
  env.NEAR_NETWORK_ID ??= "testnet";
  env.NEAR_RPC_URL ??= NODE_URL;

  return env;
}