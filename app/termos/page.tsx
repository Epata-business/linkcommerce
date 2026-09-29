import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Termos de Serviço — LinkCommerce" };

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-[#080A12] text-white/80">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-white/40 hover:text-white transition-colors mb-8 inline-block">← Voltar</Link>
        <h1 className="text-3xl font-extrabold text-white mb-2">Termos de Serviço</h1>
        <p className="text-sm text-white/30 mb-10">Última actualização: Setembro de 2026</p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-white mb-3">1. Aceitação dos Termos</h2>
            <p>Ao aceder e utilizar a plataforma LinkCommerce, o utilizador aceita ficar vinculado a estes Termos de Serviço. Se não concordar com alguma das condições, não deverá utilizar o serviço.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">2. Descrição do Serviço</h2>
            <p>A LinkCommerce é uma plataforma SaaS de comércio eletrónico que permite a criação e gestão de lojas online. O serviço inclui loja digital, gestão de produtos, processamento de pedidos, pagamentos e ferramentas de marketing.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">3. Subscrições e Pagamentos</h2>
            <p className="mb-2">Os planos de subscrição são cobrados mensalmente ou anualmente conforme o plano escolhido. Os pagamentos são processados via Stripe (cartão internacional) ou transferência bancária (mercado angolano).</p>
            <p>A LinkCommerce reserva-se o direito de suspender o acesso em caso de falta de pagamento após o período de graça de 7 dias.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">4. Comissões por Venda</h2>
            <p>Dependendo do plano subscrito, é aplicada uma comissão por venda realizada através da plataforma (0% a 3%). As comissões são debitadas automaticamente sobre cada transação processada.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">5. Responsabilidades do Utilizador</h2>
            <ul className="list-disc list-inside space-y-1.5 text-white/60">
              <li>Manter as credenciais de acesso em segurança</li>
              <li>Publicar apenas produtos e conteúdos legais</li>
              <li>Cumprir as leis comerciais e fiscais aplicáveis em Angola e/ou Portugal</li>
              <li>Não utilizar a plataforma para fins fraudulentos ou ilegais</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">6. Suspensão e Cancelamento</h2>
            <p>O utilizador pode cancelar a subscrição a qualquer momento. A LinkCommerce pode suspender ou encerrar contas que violem estes termos, com ou sem aviso prévio.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">7. Limitação de Responsabilidade</h2>
            <p>A LinkCommerce não se responsabiliza por perdas indiretas, lucros cessantes ou danos decorrentes do uso ou impossibilidade de uso da plataforma. A responsabilidade máxima da LinkCommerce limita-se ao valor pago pelo utilizador nos últimos 3 meses.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">8. Alterações aos Termos</h2>
            <p>A LinkCommerce pode actualizar estes Termos com aviso prévio de 30 dias via email. O uso continuado do serviço após esse período constitui aceitação das novas condições.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">9. Lei Aplicável</h2>
            <p>Estes Termos são regidos pela legislação da República de Angola. Eventuais litígios serão resolvidos nos tribunais competentes de Luanda.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">10. Contacto</h2>
            <p>Para questões relacionadas com estes Termos:{" "}
              <a href="https://wa.me/244939720871" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">WhatsApp</a>
              {" "}ou{" "}
              <a href="mailto:contato.epata@gmail.com" className="text-indigo-400 hover:underline">contato.epata@gmail.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
