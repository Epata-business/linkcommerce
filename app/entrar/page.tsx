import Link from "next/link";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { getLocale, t } from "@/lib/i18n";

const HeroBackground = dynamic(
  () => import("@/components/landing/HeroBackground"),
  { ssr: false }
);

export default function EntrarPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  const erro = searchParams?.erro;
  const locale = getLocale();

  const stats = [
    { v: "+2 400", l: t("stat_stores", locale) },
    { v: "€1.2M", l: t("stat_sales", locale) },
    { v: "4.9★", l: t("stat_rating", locale) },
  ];

  return (
    <div className="min-h-screen bg-[#080A12] flex relative overflow-hidden font-montserrat">
      <HeroBackground />

      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg,rgba(8,10,18,0.55) 0%,rgba(2,5,61,0.4) 100%)" }} />

      {/* Left panel */}
      <div className="hidden lg:flex relative flex-col justify-between w-1/2 p-14 text-white z-10">
        <div className="absolute inset-4 rounded-3xl" style={{ background: "rgba(21,61,236,0.07)", border: "1px solid rgba(21,61,236,0.18)", backdropFilter: "blur(12px)" }} />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-1 text-xl font-extrabold tracking-tight">
            Link<span style={{ color: "#8381FB" }}>Commerce</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="rounded-2xl p-6" style={{ background: "rgba(8,10,18,0.6)", border: "1px solid rgba(131,129,251,0.2)", backdropFilter: "blur(16px)" }}>
            <div className="flex gap-1 mb-3">
              {[...Array(5)].map((_,i) => (
                <svg key={i} className="w-4 h-4" fill="#153DFC" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              ))}
            </div>
            <blockquote className="text-base font-medium text-white/90 leading-relaxed mb-4">
              "A plataforma que transformou a minha ideia numa loja real — em menos de uma tarde."
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#153DFC,#8381FB)" }}>A</div>
              <div>
                <p className="text-sm font-semibold text-white">Ana Pereira</p>
                <p className="text-xs text-white/50">Boutique da Ana · Lisboa</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {stats.map(s => (
              <div key={s.l} className="rounded-xl p-3 text-center" style={{ background: "rgba(21,61,236,0.1)", border: "1px solid rgba(21,61,236,0.2)" }}>
                <p className="text-lg font-extrabold text-white">{s.v}</p>
                <p className="text-[10px] text-white/50 mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/30">© {new Date().getFullYear()} LinkCommerce</p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="text-2xl font-extrabold text-white">
              Link<span style={{ color: "#8381FB" }}>Commerce</span>
            </Link>
          </div>

          <div className="rounded-3xl p-8" style={{ background: "rgba(8,10,18,0.75)", border: "1px solid rgba(131,129,251,0.18)", backdropFilter: "blur(24px)", boxShadow: "0 24px 60px rgba(2,5,61,0.5)" }}>
            <Link href="/" className="inline-flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors mb-6">
              {t("signin_back", locale)}
            </Link>

            <div className="mb-7">
              <h1 className="text-2xl font-extrabold text-white">{t("signin_title", locale)}</h1>
              <p className="mt-1.5 text-sm text-white/50">
                {t("signin_sub", locale)}{" "}
                <Link href="/registo" className="font-semibold hover:underline" style={{ color: "#8381FB" }}>
                  {t("signin_sub_link", locale)}
                </Link>
              </p>
            </div>

            {erro === "credenciais" && (
              <div className="mb-5 rounded-xl px-4 py-3 text-sm text-red-300" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
                {t("signin_error", locale)}
              </div>
            )}

            <form
              action={async (formData: FormData) => {
                "use server";
                try {
                  await signIn("credentials", {
                    email: formData.get("email"),
                    password: formData.get("password"),
                    redirectTo: "/dashboard",
                  });
                } catch (error) {
                  if (error instanceof AuthError) {
                    redirect("/entrar?erro=credenciais");
                  }
                  throw error;
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wide">
                  {t("signin_email", locale)}
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  required
                  className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-[#153DFC]/50 focus:border-[#153DFC]/60 transition-all"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wide">
                  {t("signin_password", locale)}
                </label>
                <input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-[#153DFC]/50 focus:border-[#153DFC]/60 transition-all"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl py-3 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] mt-2"
                style={{ background: "linear-gradient(135deg,#153DFC,#8381FB)", boxShadow: "0 4px 24px rgba(21,61,236,0.4)" }}
              >
                {t("signin_btn", locale)} →
              </button>
            </form>

            {process.env.GOOGLE_CLIENT_ID && (
              <>
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }} />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-3 text-xs text-white/30" style={{ background: "rgba(8,10,18,0.75)" }}>
                      {t("signin_or_with", locale)}
                    </span>
                  </div>
                </div>
                <form
                  action={async () => {
                    "use server";
                    await signIn("google", { redirectTo: "/dashboard" });
                  }}
                >
                  <button
                    type="submit"
                    className="w-full rounded-xl py-2.5 text-sm font-semibold text-white/80 hover:text-white transition-all flex items-center justify-center gap-2"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    {t("signin_google", locale)}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
