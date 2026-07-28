// src/app/api/sync/github/route.ts
import { NextResponse } from "next/server";
import { getDbFromRequest, newId, nowIso } from "@/lib/db";

export async function POST(req: Request) {
  const db = getDbFromRequest(req);
  // TODO: Implement GitHub sync
  return NextResponse.json({ ok: true });
}
