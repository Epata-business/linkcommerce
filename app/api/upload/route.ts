import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadImagem } from "@/lib/cloudinary";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  if (!process.env.CLOUDINARY_API_KEY) {
    return NextResponse.json({ erro: "Upload de imagens não configurado" }, { status: 503 });
  }

  const formData = await req.formData();
  const ficheiro = formData.get("ficheiro") as File | null;

  if (!ficheiro) return NextResponse.json({ erro: "Ficheiro em falta" }, { status: 400 });
  if (!ficheiro.type.startsWith("image/")) return NextResponse.json({ erro: "Apenas imagens são permitidas" }, { status: 400 });
  if (ficheiro.size > MAX_SIZE) return NextResponse.json({ erro: "Tamanho máximo: 5 MB" }, { status: 400 });

  const buffer = Buffer.from(await ficheiro.arrayBuffer());
  const url = await uploadImagem(buffer, "produtos");

  return NextResponse.json({ url });
}
