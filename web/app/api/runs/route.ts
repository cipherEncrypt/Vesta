import fs from "node:fs";
import { runsFilePath } from "@/lib/runs-path";

export const dynamic = "force-dynamic";

const TAIL_LIMIT = 80;

type RunRow = {
  skipped?: boolean;
  timestamp?: string;
  state?: unknown;
};

function publicRun(row: RunRow) {
  const { state: _state, skipped: _skipped, reason: _reason, ...rest } =
    row as RunRow & { reason?: string };
  return rest;
}

export async function GET() {
  const file = runsFilePath();
  if (!fs.existsSync(file)) {
    return Response.json({ runs: [] });
  }
  try {
    const raw = fs.readFileSync(file, "utf8");
    const data = JSON.parse(raw) as { runs?: RunRow[] };
    const all = Array.isArray(data.runs) ? data.runs : [];
    const runs = all
      .filter((row) => !row.skipped)
      .slice(-TAIL_LIMIT)
      .map(publicRun);
    return Response.json(
      { runs },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ runs: [] });
  }
}