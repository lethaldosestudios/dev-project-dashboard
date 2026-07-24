// src/app/api/resources/[id]/route.ts
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  return NextResponse.json({ ok: true, id: params.id, updates: body });
}
