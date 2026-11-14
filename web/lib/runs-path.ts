import fs from "node:fs";
import path from "node:path";

export function runsFilePath(): string {
  if (process.env.VESTA_RUNS_FILE) {
    return process.env.VESTA_RUNS_FILE;
  }
  const fromWeb = path.join(process.cwd(), "..", "agent", "data", "runs.json");
  const fromRoot = path.join(process.cwd(), "agent", "data", "runs.json");
  if (fs.existsSync(fromWeb)) return fromWeb;
  return fromRoot;
}