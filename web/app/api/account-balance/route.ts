import { providers } from "near-api-js";
import { NODE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const accountId = new URL(request.url).searchParams.get("accountId")?.trim();
  if (!accountId || !/^[a-z0-9._-]{2,64}$/.test(accountId)) {
    return Response.json({ error: "Invalid account ID." }, { status: 400 });
  }

  try {
    const provider = new providers.JsonRpcProvider({ url: NODE_URL });
    const account = (await provider.query({
      request_type: "view_account",
      account_id: accountId,
      finality: "optimistic",
    })) as { amount?: string };
    return Response.json(
      { amount: account.amount ?? "0" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not read account.";
    return Response.json({ error: message }, { status: 502 });
  }
}
