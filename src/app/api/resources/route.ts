// src/app/api/resources/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ resources: [] });
}

export async function POST(req: Request) {
  const body = await req.json();
  return NextResponse.json({ ok: true, resource: body });
}
