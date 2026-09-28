import { NextResponse } from "next/server";
import { clearClienteSession } from "@/lib/cliente-session";

export async function POST() {
  await clearClienteSession();
  return NextResponse.json({ ok: true });
}
