import fs from "node:fs";
import path from "node:path";

export function ruleFilePath(): string {
  if (process.env.VESTA_RULE_FILE) {
    return process.env.VESTA_RULE_FILE;
  }
  const fromWeb = path.join(process.cwd(), "..", "agent", "data", "rule.json");
  const fromRoot = path.join(process.cwd(), "agent", "data", "rule.json");
  if (fs.existsSync(path.dirname(fromWeb))) return fromWeb;
  return fromRoot;
}
