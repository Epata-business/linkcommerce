import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";
import { auth } from "@/lib/auth";

// middleware.ts
// 1) Reescreve loja.linkcommerce.app -> /loja/loja  (storefront público)
// 2) Protege /dashboard/* (apenas LOJISTA / ADMIN_PLATAFORMA)
// 3) Protege /pos/* (LOJISTA, OPERADOR_POS ou ADMIN_PLATAFORMA)
// 4) /admin/* é exclusivo de ADMIN_PLATAFORMA (dashboard interno da plataforma)

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "linkcommerce.app";

export default auth((req: NextAuthRequest) => {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") ?? "";
  const subdominio = hostname.replace(`.${ROOT_DOMAIN}`, "");

  const ehSubdominioDeLoja =
    hostname !== ROOT_DOMAIN &&
    hostname !== `www.${ROOT_DOMAIN}` &&
    !hostname.startsWith("localhost") &&
    hostname.endsWith(ROOT_DOMAIN);

  if (ehSubdominioDeLoja) {
    return NextResponse.rewrite(new URL(`/loja/${subdominio}${url.pathname}`, req.url));
  }

  const role = req.auth?.user?.role;

  if (url.pathname.startsWith("/dashboard") && !["LOJISTA", "ADMIN_PLATAFORMA"].includes(role ?? "")) {
    return NextResponse.redirect(new URL("/entrar", req.url));
  }

  if (
    url.pathname.startsWith("/pos") &&
    !["LOJISTA", "OPERADOR_POS", "ADMIN_PLATAFORMA"].includes(role ?? "")
  ) {
    return NextResponse.redirect(new URL("/entrar", req.url));
  }

  if (url.pathname.startsWith("/admin") && role !== "ADMIN_PLATAFORMA") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
