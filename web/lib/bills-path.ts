import fs from "node:fs";
import path from "node:path";

export function billsFilePath(): string {
  if (process.env.VESTA_BILLS_FILE) {
    return process.env.VESTA_BILLS_FILE;
  }
  const fromWeb = path.join(process.cwd(), "..", "agent", "data", "bills.json");
  const fromRoot = path.join(process.cwd(), "agent", "data", "bills.json");
  if (fs.existsSync(path.dirname(fromWeb))) return fromWeb;
  return fromRoot;
}