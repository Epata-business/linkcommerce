import { NextRequest, NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];

export async function POST(req: NextRequest) {
  if (!process.env.CLOUDINARY_API_KEY) {
    return NextResponse.json({ erro: "Upload não configurado" }, { status: 503 });
  }

  const formData = await req.formData();
  const ficheiro = formData.get("ficheiro") as File | null;

  if (!ficheiro) return NextResponse.json({ erro: "Ficheiro em falta" }, { status: 400 });
  if (!TIPOS_PERMITIDOS.includes(ficheiro.type))
    return NextResponse.json({ erro: "Tipo de ficheiro não permitido" }, { status: 400 });
  if (ficheiro.size > MAX_SIZE)
    return NextResponse.json({ erro: "Tamanho máximo: 10 MB" }, { status: 400 });

  const buffer = Buffer.from(await ficheiro.arrayBuffer());
  const isPdf = ficheiro.type === "application/pdf";

  const url = await new Promise<string>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "linkcommerce/comprovativos",
          resource_type: isPdf ? "raw" : "image",
        },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error("Upload falhou"));
          resolve(result.secure_url);
        }
      )
      .end(buffer);
  });

  return NextResponse.json({ url });
}
