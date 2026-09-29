import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de Privacidade — LinkCommerce" };

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-[#080A12] text-white/80">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-white/40 hover:text-white transition-colors mb-8 inline-block">← Voltar</Link>
        <h1 className="text-3xl font-extrabold text-white mb-2">Política de Privacidade</h1>
        <p className="text-sm text-white/30 mb-10">Última actualização: Setembro de 2026</p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-white mb-3">1. Responsável pelo Tratamento</h2>
            <p>A LinkCommerce é responsável pelo tratamento dos dados pessoais recolhidos através desta plataforma. Contacto: <a href="mailto:contato.epata@gmail.com" className="text-indigo-400 hover:underline">contato.epata@gmail.com</a>.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">2. Dados Recolhidos</h2>
            <ul className="list-disc list-inside space-y-1.5 text-white/60">
              <li>Dados de registo: nome, email, palavra-passe (encriptada)</li>
              <li>Dados da loja: nome, logótipo, produtos, preços</li>
              <li>Dados de pedidos: nome do cliente, email, morada de entrega, produtos comprados</li>
              <li>Dados de pagamento: processados pela Stripe — a LinkCommerce não armazena dados de cartão</li>
              <li>Dados analíticos: métricas agregadas de visitas e vendas (sem identificação individual)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">3. Finalidade do Tratamento</h2>
            <ul className="list-disc list-inside space-y-1.5 text-white/60">
              <li>Prestação do serviço de loja online</li>
              <li>Processamento de pagamentos e gestão de subscrições</li>
              <li>Comunicações de serviço (confirmação de pedidos, facturas)</li>
              <li>Melhoria da plataforma com base em métricas agregadas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">4. Partilha de Dados</h2>
            <p className="mb-2">Os dados são partilhados apenas com:</p>
            <ul className="list-disc list-inside space-y-1.5 text-white/60">
              <li><strong className="text-white/80">Stripe</strong> — processamento de pagamentos (política própria em stripe.com/privacy)</li>
              <li><strong className="text-white/80">Neon / Vercel</strong> — alojamento da plataforma (dados armazenados em servidores seguros)</li>
            </ul>
            <p className="mt-3">Não vendemos, alugamos nem partilhamos dados pessoais com terceiros para fins comerciais.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">5. Tracking e Analytics</h2>
            <p>A LinkCommerce recolhe métricas de visitas e vendas de forma agregada e anónima. Não armazenamos endereços IP, user-agents, cookies de rastreamento ou qualquer identificador pessoal para fins analíticos.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">6. Retenção de Dados</h2>
            <p>Os dados são mantidos enquanto a conta estiver activa. Após cancelamento, os dados são eliminados ao fim de 90 dias, salvo obrigação legal de retenção mais longa.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">7. Direitos do Titular</h2>
            <p className="mb-2">O utilizador tem direito a:</p>
            <ul className="list-disc list-inside space-y-1.5 text-white/60">
              <li>Aceder aos seus dados pessoais</li>
              <li>Rectificar dados incorrectos</li>
              <li>Solicitar a eliminação da conta e dos dados</li>
              <li>Opor-se ao tratamento para fins de marketing</li>
            </ul>
            <p className="mt-3">Para exercer estes direitos, contacte <a href="mailto:contato.epata@gmail.com" className="text-indigo-400 hover:underline">contato.epata@gmail.com</a>.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">8. Segurança</h2>
            <p>Utilizamos encriptação TLS em todas as comunicações, passwords encriptadas com bcrypt (cost 12), tokens de sessão assinados com HMAC-SHA256, e acesso à base de dados restrito por IP e credenciais rotativas.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">9. Alterações à Política</h2>
            <p>Qualquer alteração relevante será comunicada por email com 30 dias de antecedência.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
