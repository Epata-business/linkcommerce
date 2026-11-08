/**
 * Rate limiting in-memory simples para Vercel Serverless.
 * Em produção com múltiplas instâncias, usar Redis/Upstash para estado partilhado.
 * Esta implementação protege contra abuso dentro de uma instância e é suficiente
 * para o volume atual. Migrar para Upstash Rate Limit quando o tráfego justificar.
 */
import { NextRequest } from "next/server";

interface Window {
  count: number;
  resetAt: number;
}

const store = new Map<string, Window>();

function cleanExpired() {
  const now = Date.now();
  for (const [key, win] of store.entries()) {
    if (win.resetAt < now) store.delete(key);
  }
}

export interface RateLimitOptions {
  /** Nº máximo de pedidos permitidos */
  limit: number;
  /** Janela de tempo em segundos */
  windowSec: number;
  /** Prefixo para distinguir diferentes rotas */
  prefix: string;
}

/**
 * Verifica se o pedido excede o rate limit.
 * Identifica o caller por IP (cabeçalho x-forwarded-for em Vercel).
 * @returns null se dentro do limite; Response HTTP 429 se excedido
 */
export function checkRateLimit(
  req: NextRequest,
  opts: RateLimitOptions,
): Response | null {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const key = `${opts.prefix}:${ip}`;
  const now = Date.now();
  const windowMs = opts.windowSec * 1000;

  // Limpeza periódica (1 em cada 100 chamadas)
  if (Math.random() < 0.01) cleanExpired();

  const win = store.get(key);

  if (!win || win.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  win.count++;
  if (win.count > opts.limit) {
    const retryAfter = Math.ceil((win.resetAt - now) / 1000);
    return new Response(
      JSON.stringify({ erro: "Demasiados pedidos. Tenta mais tarde." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(opts.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(win.resetAt / 1000)),
        },
      },
    );
  }

  return null;
}
