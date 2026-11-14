import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { billsFilePath } from "@/lib/bills-path";
import type { Bill, BillsFile } from "@/lib/bills-types";
import { clampDueDay } from "@/lib/bill-utils";

export const dynamic = "force-dynamic";

function readBillsFile(): BillsFile {
  const file = billsFilePath();
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8")) as BillsFile;
    if (!Array.isArray(data.bills)) return { bills: [] };
    return {
      bills: data.bills.filter(
        (b): b is Bill =>
          Boolean(
            b &&
              typeof b.id === "string" &&
              typeof b.name === "string" &&
              typeof b.amountUsd === "number" &&
              typeof b.dueDay === "number" &&
              typeof b.createdAt === "string",
          ),
      ),
    };
  } catch {
    return { bills: [] };
  }
}

function writeBillsFile(data: BillsFile) {
  const file = billsFilePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(
    temporary,
    `${JSON.stringify({ bills: data.bills }, null, 2)}\n`,
    "utf8",
  );
  fs.renameSync(temporary, file);
}

export async function GET() {
  try {
    const data = readBillsFile();
    return Response.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ bills: [] }, { headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: unknown;
      amountUsd?: unknown;
      dueDay?: unknown;
    };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const amountUsd = Number(body.amountUsd);
    const dueDay = clampDueDay(Number(body.dueDay));

    if (!name) {
      return Response.json({ error: "Bill name is required." }, { status: 400 });
    }
    if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
      return Response.json(
        { error: "Amount must be greater than zero." },
        { status: 400 },
      );
    }

    const file = readBillsFile();
    const bill: Bill = {
      id: randomUUID(),
      name,
      amountUsd,
      dueDay,
      createdAt: new Date().toISOString(),
    };
    file.bills.push(bill);
    writeBillsFile(file);
    return Response.json(bill);
  } catch {
    return Response.json({ error: "Could not add bill." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id")?.trim();
    if (!id) {
      return Response.json({ error: "Bill id is required." }, { status: 400 });
    }
    const file = readBillsFile();
    const next = file.bills.filter((b) => b.id !== id);
    if (next.length === file.bills.length) {
      return Response.json({ error: "Bill not found." }, { status: 404 });
    }
    writeBillsFile({ bills: next });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Could not delete bill." }, { status: 400 });
  }
}