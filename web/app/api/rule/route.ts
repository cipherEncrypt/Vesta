import fs from "node:fs";
import path from "node:path";
import { parseNearAmount } from "near-api-js/lib/utils/format.js";
import { ruleFilePath } from "@/lib/rule-path";
import { parseIntervalMs } from "@/lib/cadence";

export const dynamic = "force-dynamic";

type RuleFile = {
  saveAmountNear: string;
  updatedAt: string;
};

function readRule(): RuleFile | null {
  try {
    const data = JSON.parse(fs.readFileSync(ruleFilePath(), "utf8")) as RuleFile;
    if (typeof data.saveAmountNear !== "string") return null;
    return data;
  } catch {
    return null;
  }
}

function intervalMs(): number {
  return parseIntervalMs(process.env.VESTA_INTERVAL_MS);
}

export async function GET() {
  const rule = readRule();
  return Response.json(
    {
      ...(rule ?? {
        saveAmountNear:
          process.env.VESTA_SAVE_AMOUNT_NEAR?.trim() ?? "0.02",
        updatedAt: null,
      }),
      intervalMs: intervalMs(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { saveAmountNear?: unknown };
    const value =
      typeof body.saveAmountNear === "string"
        ? body.saveAmountNear.trim()
        : "";
    const yocto = parseNearAmount(value);
    if (!yocto || BigInt(yocto) <= BigInt(0)) {
      return Response.json(
        { error: "Save amount must be greater than zero." },
        { status: 400 },
      );
    }

    const rule: RuleFile = {
      saveAmountNear: value,
      updatedAt: new Date().toISOString(),
    };
    const file = ruleFilePath();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const temporary = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(temporary, `${JSON.stringify(rule, null, 2)}\n`, "utf8");
    fs.renameSync(temporary, file);

    return Response.json({ ...rule, intervalMs: intervalMs() });
  } catch {
    return Response.json({ error: "Could not save rule." }, { status: 400 });
  }
}
