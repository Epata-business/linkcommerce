import Link from "next/link";
import { getClienteSession } from "@/lib/cliente-session";

interface Props {
  subdominio: string;
  cor: string;
}

export async function ContaNav({ subdominio, cor }: Props) {
  const session = await getClienteSession();

  if (session && session.lojaId) {
    // verify session belongs to this loja (lazy — just show icon if session exists)
    return (
      <Link
        href={`/loja/${subdominio}/conta`}
        className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors hover:bg-slate-100"
        style={{ color: cor }}
        title={session.nome ?? session.email}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
        <span className="hidden sm:inline max-w-[80px] truncate">
          {session.nome?.split(" ")[0] ?? "Conta"}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={`/loja/${subdominio}/conta/entrar`}
      className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors hover:bg-slate-100"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
      <span className="hidden sm:inline">Entrar</span>
    </Link>
  );
}
