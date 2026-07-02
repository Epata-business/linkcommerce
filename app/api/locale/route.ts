import { NextRequest, NextResponse } from "next/server";

const VALID = ["pt", "en", "fr", "es"];

export function GET(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get("lang") ?? "pt";
  const back = req.nextUrl.searchParams.get("back") ?? "/";

  const res = NextResponse.redirect(new URL(back, req.url));

  if (VALID.includes(lang)) {
    res.cookies.set("LC", lang, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
    });
  }

  return res;
}
