# LinkCommerce — Plataforma SaaS de E-Commerce + POS

Esqueleto funcional que unifica:
- **OmniCommerce** → robustez do modelo de dados, omnicanalidade (online + POS unificados num só `Pedido`), POS offline-first.
- **LinkCommerce** → rapidez de setup, simplicidade de onboarding, foco em mercados emergentes (multi-moeda/local payments preparado no schema).

Stack: **Next.js 14 (App Router) · TypeScript · Tailwind · Prisma · PostgreSQL · NextAuth.js · Zustand · IndexedDB (POS offline)**

---

## 1. Arquitectura escolhida

```
linkcommerce/
├── app/
│   ├── (dashboard)/dashboard/        # Painel do COMERCIANTE (multi-tenant)
│   │   ├── produtos/                 # CRUD produtos — Server Actions
│   │   ├── pedidos/                  # Gestão de pedidos
│   │   ├── clientes/                 # CRM básico
│   │   ├── marketing/                # Cupões / sugestões IA
│   │   └── configuracoes/
│   │       └── planos/               # Escolha/upgrade de plano (cobrança)
│   ├── admin/                        # Painel INTERNO da plataforma (ADMIN_PLATAFORMA)
│   │                                 # — gestão de tenants, planos, métricas globais
│   ├── loja/[subdominio]/            # Storefront público (resolvido via middleware)
│   ├── pos/                          # Ponto de Venda (offline-first, layout tablet)
│   └── api/
│       ├── auth/[...nextauth]/       # NextAuth.js
│       ├── produtos/                 # REST (usado pelo POS / integrações externas)
│       ├── pedidos/
│       ├── checkout/                 # Criação de pedido + pagamento Stripe
│       └── pos/sync/                 # Sincronização das vendas offline
├── components/
│   ├── ui/                           # shadcn/ui (Button, Input, Dialog...)
│   ├── dashboard/                    # Componentes do painel do comerciante
│   ├── storefront/                   # Componentes da loja pública
│   └── pos/
├── lib/                              # prisma.ts, auth.ts, pos-db.ts (IndexedDB), utils.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                       # popula os 4 planos (Free/Starter/Growth/Enterprise)
├── store/                            # Zustand: cart-store.ts (storefront), pos-store.ts (POS)
└── middleware.ts                     # roteamento por subdomínio + protecção de rotas por role
```

### Porquê esta arquitectura

- **Três dashboards distintos, um único código-base**: `app/(dashboard)` é o painel do **lojista** (como o admin do Shopify); `app/admin` é o painel **interno da plataforma** (equipa LinkCommerce gere todos os tenants, planos, métricas globais); `app/loja/[subdominio]` é a **storefront pública** de cada loja. Todos partilham o mesmo `Pedido`/`Produto` no Prisma — não há duplicação de modelos entre "online" e "POS".
- **Multi-tenancy lógico por `lojaId`**: mais simples que o isolamento por schema do OmniCommerce/ADR-002 — adequado a um MVP; migrar para schema-per-tenant fica documentado como evolução futura para os planos Enterprise.
- **Monólito modular em vez de microsserviços**: os dois specs descrevem arquitecturas de microsserviços (Kafka, Elasticsearch, ClickHouse...) pensadas para escala de milhares de lojas. Para o produto descrito no fluxo de utilizador (criar loja → configurar → vender), um monólito Next.js com Route Handlers entrega o mesmo fluxo com muito menos complexidade operacional, mantendo a porta aberta a extrair serviços (ex: `pos/sync`, `checkout`) mais tarde.
- **POS offline-first**: o carrinho do POS nunca depende de rede — toda venda é gravada no IndexedDB (`lib/pos-db.ts`) antes de qualquer chamada de rede. A sincronização (`/api/pos/sync`) é idempotente via `Pedido.clientUuid` (chave única gerada no browser), portanto reenviar a mesma venda nunca duplica o pedido nem decrementa stock duas vezes.
- **Planos / subscrição**: modelos `Plano` e `Subscricao` ficam prontos no schema para suportar o requisito de "escolher o plano antes de usufruir dos serviços" — a página `dashboard/configuracoes/planos` é mostrada no onboarding e fica reutilizável para upgrade/downgrade.

---

## 2. `prisma/schema.prisma`

Ver ficheiro completo em `prisma/schema.prisma`. Resumo das entidades:

| Entidade | Propósito |
|---|---|
| `Plano` / `Subscricao` | Planos pagos da plataforma (Free/Starter/Growth/Enterprise) e subscrição de cada loja |
| `User` / `Account` / `Session` | NextAuth (email+senha e Google) |
| `Loja` | Tenant — cores, logótipo, subdomínio, domínio próprio |
| `MetodoPagamentoLoja` / `MetodoEnvio` | Configuração de pagamentos (Stripe, MB Way, Multicaixa) e envios |
| `Produto` / `Variante` | Catálogo com variantes (cor/tamanho) |
| `Cliente` | CRM básico por loja |
| `Pedido` / `ItemPedido` | Unificado online + POS, com `clientUuid` para sync offline |
| `Cupao` | Marketing — descontos % ou valor fixo |

## 3–5. Código

- Storefront: `app/loja/[subdominio]/page.tsx` + `components/storefront/add-to-cart-button.tsx` + `store/cart-store.ts`
- CRUD produtos: `app/(dashboard)/dashboard/produtos/page.tsx` + `actions.ts` (Server Actions) + componentes em `components/dashboard/`
- POS offline: `app/pos/page.tsx` + `store/pos-store.ts` + `lib/pos-db.ts` + `app/api/pos/sync/route.ts`

---

## 6. Instruções de configuração

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# preencher DATABASE_URL, AUTH_SECRET (npx auth secret), GOOGLE_CLIENT_ID/SECRET, STRIPE_*

# 3. Criar a base de dados e aplicar o schema
npx prisma migrate dev --name init

# 4. Popular os planos de subscrição
npm run prisma:seed

# 5. Arrancar em desenvolvimento
npm run dev
```

Em desenvolvimento local, como `localhost` não suporta subdomínios reais, aceda à storefront directamente via `http://localhost:3000/loja/<subdominio>`. Em produção, configure um wildcard DNS (`*.linkcommerce.app`) apontando para a aplicação — o `middleware.ts` trata a reescrita automaticamente.

### Próximos passos sugeridos (fora deste esqueleto)
- Integração real do Stripe Checkout/Billing em `/api/checkout` e `/api/checkout/subscricao`
- Upload de imagens (S3/Cloudinary) em vez de campo `imagemUrl` por URL
- Painel `app/admin` (gestão de tenants pela equipa LinkCommerce)
- Testes E2E do fluxo crítico: criar loja → publicar → checkout → POS offline → sync
