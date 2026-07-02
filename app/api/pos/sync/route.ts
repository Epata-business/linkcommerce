import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// -----------------------------------------------------------------------------
// app/api/pos/sync/route.ts
// Recebe um lote de vendas guardadas em IndexedDB e cria os Pedidos
// correspondentes (channel: 'POS'). Idempotente via Pedido.clientUuid
// (unique) — reenviar a mesma venda nunca duplica o pedido nem decrementa
// o stock duas vezes.
// -----------------------------------------------------------------------------

const itemSchema = z.object({
  produtoId: z.string(),
  varianteId: z.string().optional(),
  titulo: z.string(),
  quantidade: z.number().int().positive(),
  precoUnitario: z.number().nonnegative(),
});

const vendaSchema = z.object({
  clientUuid: z.string().uuid(),
  lojaId: z.string(),
  itens: z.array(itemSchema).min(1),
  total: z.number().nonnegative(),
  clienteEmail: z.string().email().optional(),
  criadoEm: z.string(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const { vendas } = z.object({ vendas: z.array(vendaSchema) }).parse(body);

  const sincronizadas: string[] = [];

  for (const venda of vendas) {
    // já sincronizada anteriormente? não falha, apenas confirma ao cliente
    const existente = await prisma.pedido.findUnique({ where: { clientUuid: venda.clientUuid } });
    if (existente) {
      sincronizadas.push(venda.clientUuid);
      continue;
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.pedido.create({
          data: {
            lojaId: venda.lojaId,
            clienteEmail: venda.clienteEmail ?? "cliente-balcao@pos.local",
            subtotal: venda.total,
            total: venda.total,
            status: "DELIVERED", // venda POS é entregue no acto
            channel: "POS",
            clientUuid: venda.clientUuid,
            sincronizadoEm: new Date(),
            createdAt: new Date(venda.criadoEm),
            itens: {
              create: venda.itens.map((item) => ({
                produtoId: item.produtoId,
                varianteId: item.varianteId,
                quantidade: item.quantidade,
                precoUnitario: item.precoUnitario,
              })),
            },
          },
        });

        // Decrementa stock — mesma lógica usada no checkout online
        for (const item of venda.itens) {
          if (item.varianteId) {
            await tx.variante.update({
              where: { id: item.varianteId },
              data: { stock: { decrement: item.quantidade } },
            });
          } else {
            await tx.produto.update({
              where: { id: item.produtoId },
              data: { stock: { decrement: item.quantidade } },
            });
          }
        }
      });

      sincronizadas.push(venda.clientUuid);
    } catch (erro) {
      // Uma venda falhar não deve impedir a sincronização das restantes do lote
      console.error(`Falha ao sincronizar venda ${venda.clientUuid}:`, erro);
    }
  }

  return NextResponse.json({ sincronizadas });
}
