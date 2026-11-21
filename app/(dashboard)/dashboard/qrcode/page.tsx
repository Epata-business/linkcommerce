import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";
import { QrCodeManager } from "@/components/dashboard/qrcode-manager";
import { QrCode, MousePointerClick, CalendarDays, type LucideIcon } from "lucide-react";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "linkcommerce.cc";

export default async function QRCodePage() {
  const lojaId = await getLojaId();

  const [loja, qrcodes] = await Promise.all([
    prisma.loja.findUnique({
      where: { id: lojaId },
      select: { subdominio: true, nome: true, moeda: true, corPrimaria: true },
    }),
    prisma.qrCode.findMany({
      where: { lojaId },
      orderBy: { criadoEm: "desc" },
      include: {
        _count: { select: { scans: true } },
        scans: {
          where: {
            dia: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
          select: { dia: true },
        },
      },
    }),
  ]);

  const lojaUrl = loja ? `https://${loja.subdominio}.${ROOT_DOMAIN}` : "";
  const cor = loja?.corPrimaria ?? "#153DFC";

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const qrcodesComStats = qrcodes.map((qr) => ({
    id: qr.id,
    slug: qr.slug,
    nome: qr.nome,
    destino: qr.destino,
    ativo: qr.ativo,
    totalScans: qr._count.scans,
    scans7d: qr.scans.length,
    scansHoje: qr.scans.filter((s) => new Date(s.dia).getTime() === hoje.getTime()).length,
    criadoEm: qr.criadoEm,
  }));

  // Stats globais
  const totalScans = qrcodesComStats.reduce((s, q) => s + q.totalScans, 0);
  const scansHoje = qrcodesComStats.reduce((s, q) => s + q.scansHoje, 0);
  const scans7d = qrcodesComStats.reduce((s, q) => s + q.scans7d, 0);

  return (
    <div className="min-h-screen" style={{ background: "#F7F8FC" }}>
      <div className="max-w-4xl mx-auto px-5 py-7">

        <div className="mb-6">
          <h1 className="heading-lg">QR Codes</h1>
          <p className="body-sm mt-0.5">
            QR Codes dinâmicos — altere o destino sem reimprimir.
          </p>
        </div>

        {/* Stats globais */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {([
            { Icon: QrCode,            label: "QR Codes criados", value: qrcodes.length.toString() },
            { Icon: MousePointerClick, label: "Scans total",       value: totalScans.toString() },
            { Icon: CalendarDays,      label: "Scans últimos 7d",  value: scans7d.toString() },
          ] as { Icon: LucideIcon; label: string; value: string }[]).map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-4" style={{ border: "1px solid hsl(220 20% 91%)", boxShadow: "0 1px 3px rgba(15,17,23,0.04)" }}>
              <s.Icon className="w-4 h-4 text-[#9CA3AF] mb-2" strokeWidth={1.75} />
              <p className="text-xl font-semibold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <QrCodeManager
          qrcodes={qrcodesComStats}
          rootDomain={ROOT_DOMAIN}
          lojaUrl={lojaUrl}
          cor={cor}
        />
      </div>
    </div>
  );
}
