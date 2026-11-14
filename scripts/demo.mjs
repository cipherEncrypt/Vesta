import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(label, args) {
  const child = spawn("npm", args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
  child.on("exit", (code, signal) => {
    if (signal) {
      console.log(`[${label}] stopped (${signal})`);
    } else if (code && code !== 0) {
      console.log(`[${label}] exited with code ${code}`);
    }
  });
  return child;
}

console.log("Vesta demo — web on :3000 + autopilot agent");
console.log("Ctrl+C stops both.\n");

const web = run("web", ["run", "dev"]);
const agent = run("agent", ["run", "agent"]);

function shutdown() {
  web.kill("SIGTERM");
  agent.kill("SIGTERM");
  setTimeout(() => process.exit(0), 300);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);