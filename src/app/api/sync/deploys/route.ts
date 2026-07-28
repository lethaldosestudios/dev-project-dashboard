// src/app/api/sync/deploys/route.ts
import { NextResponse } from "next/server";
import { getDbFromRequest } from "@/lib/db";

export async function POST(req: Request) {
  const db = getDbFromRequest(req);
  // TODO: Implement deploy sync
  return NextResponse.json({ ok: true });
}
