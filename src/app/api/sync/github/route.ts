export const runtime = 'edge';

// src/app/api/sync/github/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ ok: true });
}
