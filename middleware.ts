import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "linkcommerce.app";

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
    hostname.endsWith(ROOT_DOMAIN);

  if (ehSubdominioDeLoja) {
    return NextResponse.rewrite(new URL(`/loja/${subdominio}${url.pathname}`, req.url));
  }

  // 2) Protege rotas autenticadas — lê JWT directamente (sem importar Prisma/bcrypt)
  const rotas = ["/dashboard", "/pos", "/admin"];
  const precisaAuth = rotas.some(r => url.pathname.startsWith(r));
  if (!precisaAuth) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const role = token?.role as string | undefined;

  if (url.pathname.startsWith("/dashboard") && !["LOJISTA", "ADMIN_PLATAFORMA"].includes(role ?? "")) {
    return NextResponse.redirect(new URL("/entrar", req.url));
  }

  if (url.pathname.startsWith("/pos") && !["LOJISTA", "OPERADOR_POS", "ADMIN_PLATAFORMA"].includes(role ?? "")) {
    return NextResponse.redirect(new URL("/entrar", req.url));
  }

  if (url.pathname.startsWith("/admin") && role !== "ADMIN_PLATAFORMA") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
