import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";

export default function RegistoPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  const erro = searchParams?.erro;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Painel esquerdo — decorativo */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-12 text-white">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Link<span className="text-indigo-200">Commerce</span>
        </Link>
        <div className="space-y-6">
          <h2 className="text-3xl font-extrabold leading-tight">
            A sua loja online<br />começa aqui.
          </h2>
          <ul className="space-y-3 text-indigo-100 text-sm">
            {[
              "✓ Loja online pronta em minutos",
              "✓ POS offline para vender presencialmente",
              "✓ Cupões, clientes e analytics incluídos",
              "✓ Plano gratuito para começar",
            ].map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <p className="text-indigo-300 text-xs">© {new Date().getFullYear()} LinkCommerce</p>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6">
            ← Página inicial
          </Link>
          <div className="mb-8 text-center lg:text-left">
            <Link href="/" className="lg:hidden text-xl font-bold text-slate-900 mb-6 block">
              Link<span className="text-indigo-600">Commerce</span>
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">Criar conta grátis</h1>
            <p className="mt-1 text-sm text-slate-500">
              Já tem conta?{" "}
              <Link href="/entrar" className="font-semibold text-indigo-600 hover:underline">
                Entrar
              </Link>
            </p>
          </div>

          {erro === "email-em-uso" && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              Este email já está registado. <Link href="/entrar" className="font-semibold underline">Entre aqui.</Link>
            </div>
          )}
          {erro === "dados-invalidos" && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              Dados inválidos. A senha deve ter pelo menos 6 caracteres.
            </div>
          )}

          <form
            action={async (formData: FormData) => {
              "use server";
              const nome = formData.get("nome") as string;
              const email = formData.get("email") as string;
              const password = formData.get("password") as string;

              if (!nome || !email || !password || password.length < 6) {
                redirect("/registo?erro=dados-invalidos");
              }

              const existente = await prisma.user.findUnique({ where: { email } });
              if (existente) redirect("/registo?erro=email-em-uso");

              const passwordHash = await bcrypt.hash(password, 12);
              await prisma.user.create({
                data: { name: nome, email, passwordHash, role: "LOJISTA" },
              });

              try {
                await signIn("credentials", { email, password, redirectTo: "/onboarding" });
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
              <input
                name="nome"
                type="text"
                placeholder="O seu nome"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                name="email"
                type="email"
                placeholder="email@exemplo.com"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
              <input
                name="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Criar conta e continuar →
            </button>
            <p className="text-center text-xs text-slate-400">
              Ao criar conta aceita os nossos{" "}
              <span className="underline cursor-pointer">Termos de Serviço</span>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
