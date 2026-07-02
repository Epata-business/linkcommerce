import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ADMIN_PLATAFORMA") {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const lojaId = searchParams.get("lojaId");
  const sair = searchParams.get("sair");

  const jar = cookies();

  if (sair === "1") {
    jar.delete("admin_loja_override");
    return NextResponse.redirect(new URL("/admin/lojas", req.url));
  }

  if (!lojaId) {
    return NextResponse.json({ erro: "lojaId em falta" }, { status: 400 });
  }

  jar.set("admin_loja_override", lojaId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60, // 1 hora
  });

  return NextResponse.redirect(new URL("/dashboard", req.url));
}
