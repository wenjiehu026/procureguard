import { NextResponse } from "next/server";
import { purchaseRequestSchema } from "@/lib/procurement/schemas";

export async function POST(request: Request) {
  const apiKey = request.headers.get("x-procureguard-api-key");
  const expected = process.env.PROCUREMENT_API_KEY ?? "mock-procurement-key";

  if (apiKey !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const input = purchaseRequestSchema.parse(body);

  return NextResponse.json({
    requestId: `pr-${crypto.randomUUID().slice(0, 8)}`,
    quoteId: input.quoteId,
    amount: input.amount,
    currency: input.currency,
    approvalId: input.approvalId,
    piiHandling: "terminal3-placeholders",
  });
}
