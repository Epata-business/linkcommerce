import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { neon } from "@neondatabase/serverless";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "linkcommerce.cc";

// NextAuth v5 mudou o nome do cookie de "next-auth.session-token" para "authjs.session-token"
const COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") ?? "";
  const subdominio = hostname.replace(`.${ROOT_DOMAIN}`, "");

  // 1) Reescreve subdomain de loja → /loja/[subdominio]
  const ehSubdominioDeLoja =
    hostname !== ROOT_DOMAIN &&
    hostname !== `www.${ROOT_DOMAIN}` &&
    !hostname.includes("localhost") &&
    !hostname.includes("vercel.app") &&
    hostname.endsWith(`.${ROOT_DOMAIN}`);

  if (ehSubdominioDeLoja) {
    return NextResponse.rewrite(new URL(`/loja/${subdominio}${url.pathname}`, req.url));
  }

  // 1b) Domínio próprio — lookup rápido via Neon HTTP (edge-compatible)
  const ehDominioProprio =
    hostname !== ROOT_DOMAIN &&
    hostname !== `www.${ROOT_DOMAIN}` &&
    !hostname.includes("localhost") &&
    !hostname.includes("vercel.app") &&
    !hostname.endsWith(`.${ROOT_DOMAIN}`);

  if (ehDominioProprio && process.env.DATABASE_URL) {
    try {
      const sql = neon(process.env.DATABASE_URL);
      const rows = await sql`SELECT subdominio FROM lojas WHERE "dominioProprio" = ${hostname} AND publicada = true LIMIT 1`;
      if (rows.length > 0) {
        const sub = (rows[0] as { subdominio: string }).subdominio;
        return NextResponse.rewrite(new URL(`/loja/${sub}${url.pathname}`, req.url));
      }
    } catch {
      // se DB falhar, deixa passar — a página de 404 trata
    }
  }

  // 2) Protege rotas autenticadas — lê JWT directamente (sem importar Prisma/bcrypt)
  // Injeta headers úteis em todos os requests
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", url.pathname);
  if (process.env.NODE_ENV === "development" && url.searchParams.get("_geo")) {
    requestHeaders.set("x-geo-override", url.searchParams.get("_geo")!);
  }

  const rotas = ["/dashboard", "/pos", "/admin"];
  const precisaAuth = rotas.some(r => url.pathname.startsWith(r));
  if (!precisaAuth) return NextResponse.next({ request: { headers: requestHeaders } });

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    cookieName: COOKIE_NAME,
  });
  const role = token?.role as string | undefined;

  const rolesDashboard = ["LOJISTA", "GESTOR", "OPERADOR", "MARKETING", "FINANCEIRO", "ADMIN_PLATAFORMA"];
  if (url.pathname.startsWith("/dashboard") && !rolesDashboard.includes(role ?? "")) {
    return NextResponse.redirect(new URL("/entrar", req.url));
  }

  if (url.pathname.startsWith("/pos") && !["LOJISTA", "OPERADOR_POS", "ADMIN_PLATAFORMA"].includes(role ?? "")) {
    return NextResponse.redirect(new URL("/entrar", req.url));
  }

  if (url.pathname.startsWith("/admin") && role !== "ADMIN_PLATAFORMA") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
