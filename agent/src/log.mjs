import fs from "node:fs";
import path from "node:path";

const EMPTY = { runs: [] };
const MAX_RUNS = 120;

export function appendRun(logFile, entry) {
  fs.mkdirSync(path.dirname(logFile), { recursive: true });

  let doc = EMPTY;
  if (fs.existsSync(logFile)) {
    try {
      doc = JSON.parse(fs.readFileSync(logFile, "utf8"));
      if (!Array.isArray(doc.runs)) doc = { runs: [] };
    } catch {
      doc = EMPTY;
    }
  }

  doc.runs.push(entry);
  if (doc.runs.length > MAX_RUNS) {
    doc.runs = doc.runs.slice(-MAX_RUNS);
  }
  const tmp = `${logFile}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(doc)}\n`, "utf8");
  fs.renameSync(tmp, logFile);
}