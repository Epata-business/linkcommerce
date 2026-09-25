import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const data = searchParams.get("data");
  const size = Math.min(Math.max(parseInt(searchParams.get("size") ?? "600"), 100), 2000);
  const color = (searchParams.get("color") ?? "153DFC").replace("#", "");

  if (!data) return NextResponse.json({ erro: "Parâmetro data em falta" }, { status: 400 });

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&color=${color}&bgcolor=ffffff&qzone=3&format=png`;

  const res = await fetch(qrUrl);
  if (!res.ok) return NextResponse.json({ erro: "Erro ao gerar QR Code" }, { status: 502 });

  const buffer = await res.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="qrcode.png"`,
      "Cache-Control": "no-store",
    },
  });
}
