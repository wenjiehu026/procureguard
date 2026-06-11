import { NextResponse } from "next/server";
import { findQuotes } from "@/lib/procurement/data";
import { procurementSearchSchema } from "@/lib/procurement/schemas";

export async function POST(request: Request) {
  const body = await request.json();
  const input = procurementSearchSchema.parse(body);

  return NextResponse.json({
    quotes: findQuotes(input),
    source: "procureguard-demo-supplier-network",
  });
}
