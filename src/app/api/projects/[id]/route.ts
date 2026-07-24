// src/app/api/projects/[id]/route.ts
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return NextResponse.json({ id: params.id });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  return NextResponse.json({ ok: true, id: params.id, updates: body });
}
