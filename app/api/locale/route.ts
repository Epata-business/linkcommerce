import { NextRequest, NextResponse } from "next/server";

const VALID = ["pt", "en", "fr", "es"];

const LOCALE_CURRENCY: Record<string, string> = {
  pt: "EUR",
  en: "USD",
  fr: "EUR",
  es: "EUR",
};

export function GET(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get("lang") ?? "pt";
  const back = req.nextUrl.searchParams.get("back") ?? "/";

  const res = NextResponse.redirect(new URL(back, req.url));

  if (VALID.includes(lang)) {
    const cookieOpts = { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" as const };
    res.cookies.set("LC", lang, cookieOpts);
    res.cookies.set("CUR", LOCALE_CURRENCY[lang] ?? "EUR", cookieOpts);
  }

  return res;
}
