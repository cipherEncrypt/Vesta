import { providers } from "near-api-js";
import { VAULT_CONTRACT_ID, NODE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  const provider = new providers.JsonRpcProvider({ url: NODE_URL });
  try {
    const raw = await provider.query({
      request_type: "call_function",
      account_id: VAULT_CONTRACT_ID,
      method_name: "get_state",
      args_base64: Buffer.from("{}").toString("base64"),
      finality: "optimistic",
    });
    const bytes = (raw as { result?: number[] }).result;
    if (!bytes) throw new Error("empty result");
    const state = JSON.parse(Buffer.from(bytes).toString("utf8"));
    return Response.json(state, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const message = e instanceof Error ? e.message : "view failed";
    return Response.json({ error: message }, { status: 502 });
  }
}