import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatarPreco } from "@/lib/moeda";

interface Props { params: { subdominio: string; pedidoId: string } }

export default async function SucessoPage({ params }: Props) {
  // pedidoId pode ser um Stripe session ID ou um ID real — tentamos os dois
  const pedido = await prisma.pedido.findFirst({
    where: {
      OR: [
        { id: params.pedidoId },
        { clientUuid: params.pedidoId },
      ],
      loja: { subdominio: params.subdominio },
    },
    include: {
      itens: { include: { produto: { select: { titulo: true } } } },
      loja: { select: { nome: true, corPrimaria: true, moeda: true } },
    },
  });

  const cor = pedido?.loja?.corPrimaria ?? "#153DFC";
  const moeda = pedido?.loja?.moeda ?? "EUR";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-16 text-center">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-6 shadow-lg"
        style={{ background: `linear-gradient(135deg, ${cor}, ${cor}bb)` }}
      >
        ✓
      </div>

      <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Pedido confirmado!</h1>
      <p className="text-slate-500 text-lg mb-6">
        Obrigado pela sua compra{pedido?.loja?.nome ? ` em ${pedido.loja.nome}` : ""}.
        Vai receber um email de confirmação em breve.
      </p>

      {pedido && (
        <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-sm text-left mb-8">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-slate-500">
              Pedido <span className="font-bold text-slate-800">#{pedido.id.slice(-8).toUpperCase()}</span>
            </p>
            <span className="text-xs font-semibold rounded-full px-3 py-1 bg-green-50 text-green-700">
              Confirmado ✓
            </span>
          </div>

          <div className="space-y-2 mb-4">
            {pedido.itens.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-slate-600">
                  {item.produto?.titulo ?? "Produto"} ×{item.quantidade}
                </span>
                <span className="font-medium">{formatarPreco(Number(item.precoUnitario) * item.quantidade, moeda)}</span>
              </div>
            ))}
          </div>

          <div className="border-t pt-3 flex justify-between">
            <span className="font-semibold text-slate-800">Total pago</span>
            <span className="text-xl font-black" style={{ color: cor }}>
              {formatarPreco(Number(pedido.total), moeda)}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-center">
        {pedido && (
          <a
            href={`/api/fatura/${pedido.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl px-6 py-3 text-sm font-bold border-2 transition-all hover:opacity-80"
            style={{ borderColor: cor, color: cor }}
          >
            🧾 Descarregar Fatura
          </a>
        )}
        <Link
          href={`/loja/${params.subdominio}`}
          className="rounded-xl px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${cor}, ${cor}bb)` }}
        >
          Continuar a comprar
        </Link>
      </div>
    </div>
  );
}
