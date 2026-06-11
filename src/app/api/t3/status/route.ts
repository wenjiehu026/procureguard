import { NextResponse } from "next/server";
import { getTerminal3Status } from "@/lib/t3/status";

export async function GET() {
  return NextResponse.json(await getTerminal3Status());
}

export async function POST() {
  return NextResponse.json(await getTerminal3Status());
}
