import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";
import { formatarPreco } from "@/lib/moeda";
import { PedidoActions } from "./pedido-actions";

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  PENDING:    { label: "Pendente",         dot: "bg-yellow-400", bg: "bg-yellow-50",  text: "text-yellow-700" },
  PROCESSING: { label: "Em processamento", dot: "bg-blue-400",   bg: "bg-blue-50",    text: "text-blue-700"   },
  SHIPPED:    { label: "Enviado",          dot: "bg-purple-400", bg: "bg-purple-50",  text: "text-purple-700" },
  DELIVERED:  { label: "Entregue",         dot: "bg-green-400",  bg: "bg-green-50",   text: "text-green-700"  },
  CANCELLED:  { label: "Cancelado",        dot: "bg-red-400",    bg: "bg-red-50",     text: "text-red-700"    },
};

const METODO_LABEL: Record<string, string> = {
  cartao: "Cartão de crédito / débito",
  mbway: "MB WAY",
  multibanco: "Referência Multibanco",
  multicaixa: "Multicaixa Express",
  paypal: "PayPal",
};

export default async function PedidoDetailPage({ params }: { params: { id: string } }) {
  const lojaId = await getLojaId();

  const [loja, pedido] = await Promise.all([
    prisma.loja.findUnique({ where: { id: lojaId }, select: { moeda: true, corPrimaria: true } }),
    prisma.pedido.findFirst({
      where: { id: params.id, lojaId },
      include: {
        itens: {
          include: {
            produto: { select: { titulo: true, imagemUrl: true } },
            variante: { select: { nomeOpcao: true } },
          },
        },
      },
    }),
  ]);

  if (!loja || !pedido) notFound();

  const moeda = loja.moeda ?? "EUR";
  const cor = loja.corPrimaria ?? "#153DFC";
  const cfg = STATUS_CONFIG[pedido.status] ?? STATUS_CONFIG.PENDING;
  const moradaJson = (pedido.morada as Record<string, unknown>) ?? {};
  const tracking = moradaJson.tracking as string | undefined;
  const metodoPagamento = moradaJson.metodoPagamento as string | undefined;

  const estadosPossiveis = [
    { value: "PENDING",    label: "Pendente" },
    { value: "PROCESSING", label: "Em processamento" },
    { value: "SHIPPED",    label: "Enviado" },
    { value: "DELIVERED",  label: "Entregue" },
    { value: "CANCELLED",  label: "Cancelado" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard/pedidos"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            ← Pedidos
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-black text-slate-900">#{pedido.id.slice(-8).toUpperCase()}</h1>
              <a href={`/api/fatura/${pedido.id}`} target="_blank" rel="noopener noreferrer"
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                🧾 Fatura
              </a>
              <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${cfg.bg} ${cfg.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date(pedido.createdAt).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Itens do pedido */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">Itens do pedido</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {pedido.itens.map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {item.produto?.imagemUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.produto.imagemUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-black text-slate-400">
                        {(item.produto?.titulo ?? "P").charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{item.produto?.titulo ?? "Produto removido"}</p>
                    {item.variante && (
                      <p className="text-xs text-slate-400">{item.variante.nomeOpcao}</p>
                    )}
                    <p className="text-xs text-slate-400">Qtd. {item.quantidade} × {formatarPreco(Number(item.precoUnitario), moeda)}</p>
                  </div>
                  <p className="text-sm font-bold text-slate-900 flex-shrink-0">
                    {formatarPreco(Number(item.precoUnitario) * item.quantidade, moeda)}
                  </p>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-slate-100 space-y-1.5">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotal</span>
                <span>{formatarPreco(Number(pedido.subtotal), moeda)}</span>
              </div>
              {Number(pedido.desconto) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Desconto</span>
                  <span>−{formatarPreco(Number(pedido.desconto), moeda)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-slate-900 text-base pt-1 border-t border-slate-100">
                <span>Total</span>
                <span style={{ color: cor }}>{formatarPreco(Number(pedido.total), moeda)}</span>
              </div>
            </div>
          </div>

          {/* Cliente + Morada */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h2 className="font-bold text-slate-800 mb-3">Cliente</h2>
              <div className="space-y-1.5 text-sm">
                <p className="font-semibold text-slate-900">{pedido.clienteNome ?? "—"}</p>
                <p className="text-slate-500">{pedido.clienteEmail}</p>
                {(moradaJson.clienteTelefone as string) && (
                  <p className="text-slate-500">{moradaJson.clienteTelefone as string}</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h2 className="font-bold text-slate-800 mb-3">Entrega</h2>
              {(moradaJson.rua || moradaJson.cidade) ? (
                <div className="space-y-0.5 text-sm text-slate-600">
                  {!!moradaJson.rua && <p>{moradaJson.rua as string}</p>}
                  <p>
                    {[moradaJson.codigoPostal as string, moradaJson.cidade as string].filter(Boolean).join(" ")}
                  </p>
                  {!!moradaJson.pais && <p>{moradaJson.pais as string}</p>}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Sem morada registada</p>
              )}
              {metodoPagamento && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-400">Método de pagamento</p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">
                    {METODO_LABEL[metodoPagamento] ?? metodoPagamento}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Acções — actualizar status e tracking */}
          <PedidoActions
            pedidoId={pedido.id}
            statusAtual={pedido.status}
            trackingAtual={tracking ?? ""}
            estadosPossiveis={estadosPossiveis}
            cor={cor}
          />
        </div>
      </div>
    </div>
  );
}
