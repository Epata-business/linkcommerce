"use client";

// Casa Mussulo — "Produtos clicáveis dentro do ambiente": a sala ilustrada com pontos
// sobre o candeeiro, o sofá e a mesa, ligados às primeiras peças da loja.
import { useState } from "react";
import Link from "next/link";
import { formatarPreco } from "@/lib/moeda";
import { Sala } from "./ilustracoes";

// Posições em % do viewBox da Sala (1200×560): candeeiro, sofá, mesa de apoio.
const PONTOS = [
  { x: 31.5, y: 30.5 },
  { x: 53.3, y: 76 },
  { x: 77.5, y: 85 },
];

export interface PontoAmbiente {
  id: string;
  titulo: string;
  preco: number;
  href: string;
}

export function Ambiente({ pecas, moeda }: { pecas: PontoAmbiente[]; moeda: string }) {
  const [aberto, setAberto] = useState<number | null>(null);

  return (
    <div className="relative w-full">
      <Sala className="block w-full h-auto" />
      {pecas.slice(0, PONTOS.length).map((p, i) => {
        const pos = PONTOS[i];
        const visivel = aberto === i;
        return (
          <div key={p.id} className="group absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
            <button
              type="button"
              aria-label={p.titulo}
              aria-expanded={visivel}
              onClick={() => setAberto(visivel ? null : i)}
              className="relative flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#1D2522] shadow-md ring-2 ring-white/40 transition hover:scale-110 sm:h-8 sm:w-8 sm:text-lg sm:ring-4"
            >
              <span className="absolute inset-0 rounded-full bg-white/60 animate-ping" aria-hidden="true" />
              <span className="relative">+</span>
            </button>
            {/* pb-3 em vez de margem: o rato atravessa o espaço sem fechar a etiqueta */}
            <div
              className={`absolute bottom-full left-1/2 -translate-x-1/2 pb-3 transition ${
                visivel ? "opacity-100" : "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100"
              }`}
            >
              <Link
                href={p.href}
                className="block whitespace-nowrap rounded-full bg-[#1D2522] px-4 py-2 text-xs font-semibold text-[#F2F2EF] shadow-lg"
              >
                {p.titulo} · {formatarPreco(p.preco, moeda)}
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
