export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=near&vs_currencies=usd",
      { next: { revalidate: 60 } },
    );
    if (!res.ok) throw new Error("price fetch failed");
    const data = (await res.json()) as { near?: { usd?: number } };
    const usd = data.near?.usd;
    if (typeof usd !== "number") throw new Error("no price");
    return Response.json({ usd });
  } catch {
    return Response.json({ usd: null });
  }
}