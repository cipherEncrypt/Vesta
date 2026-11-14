import fs from "node:fs";
import path from "node:path";

export function agentPackageRoot(): string {
  const candidates = [
    path.join(process.cwd(), "..", "agent"),
    path.join(process.cwd(), "agent"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "src", "run-once-cli.mjs"))) {
      return candidate;
    }
  }
  return candidates[0];
}