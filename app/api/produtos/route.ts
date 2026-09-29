import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// -----------------------------------------------------------------------------
// app/api/produtos/route.ts
// Endpoint REST usado por integrações externas e pelo /pos (que corre no
// browser e precisa de uma chamada fetch simples, fora do contexto de
// Server Actions). O dashboard usa as Server Actions em
// app/(dashboard)/dashboard/produtos/actions.ts para o mesmo CRUD.
// -----------------------------------------------------------------------------

export async function GET() {
  const session = await auth();
  if (!session?.user?.lojaId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const produtos = await prisma.produto.findMany({
    where: { lojaId: session.user.lojaId as string, ativo: true },
    orderBy: { titulo: "asc" },
  });

  return NextResponse.json({
    produtos: produtos.map((p) => ({
      id: p.id,
      titulo: p.titulo,
      preco: Number(p.preco),
      stock: p.stock,
      imagemUrl: p.imagemUrl,
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.lojaId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const titulo = (typeof body.titulo === "string" ? body.titulo : "").trim().slice(0, 200);
  if (!titulo) return NextResponse.json({ error: "título obrigatório" }, { status: 400 });

  const produto = await prisma.produto.create({
    data: {
      lojaId: session.user.lojaId as string,
      titulo,
      descricao: typeof body.descricao === "string" ? body.descricao.slice(0, 5000) : null,
      preco: typeof body.preco === "number" && body.preco >= 0 ? body.preco : 0,
      stock: typeof body.stock === "number" && body.stock >= 0 ? Math.floor(body.stock) : 0,
      imagemUrl: typeof body.imagemUrl === "string" ? body.imagemUrl.slice(0, 2048) : null,
      ativo: body.ativo !== false,
    },
  });

  return NextResponse.json({ produto }, { status: 201 });
}
