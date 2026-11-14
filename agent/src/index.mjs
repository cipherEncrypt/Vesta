import { loadConfig, assertConfig } from "./config.mjs";
import { appendRun } from "./log.mjs";
import { executeAutoSaveOnce } from "./run-once.mjs";

let ticking = false;
let timer = null;

async function tick(config) {
  if (ticking) {
    console.log("[vesta-agent] still running previous tick, skip overlap");
    return;
  }
  ticking = true;
  try {
    await executeAutoSaveOnce(config);
  } catch (err) {
    const message = String(err?.message ?? err);
    console.error("[vesta-agent] error:", message);
    appendRun(config.logFile, {
      timestamp: new Date().toISOString(),
      skipped: false,
      error: message,
      amount: null,
      txHash: null,
      state: null,
    });
  } finally {
    ticking = false;
  }
}

function main() {
  const config = loadConfig();
  try {
    assertConfig(config);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  console.log("[vesta-agent] owner:", config.ownerAccountId);
  console.log("[vesta-agent] vault:", config.vaultAccountId);
  console.log("[vesta-agent] key from:", config.agentKey.source);
  console.log("[vesta-agent] log:", config.logFile);
  console.log("[vesta-agent] rule:", config.ruleFile);
  console.log("[vesta-agent] interval ms:", config.intervalMs);

  void tick(config);
  timer = setInterval(() => void tick(config), config.intervalMs);

  const shutdown = () => {
    if (timer) clearInterval(timer);
    console.log("[vesta-agent] stopped");
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main();