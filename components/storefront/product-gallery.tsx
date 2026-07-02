"use client";

import { useState } from "react";
import Image from "next/image";

export function ProductGallery({ imagemUrl, titulo, cor }: {
  imagemUrl: string;
  titulo: string;
  cor: string;
}) {
  const [zoom, setZoom] = useState(false);

  return (
    <>
      <div
        className="relative aspect-square rounded-3xl overflow-hidden cursor-zoom-in bg-slate-50 border border-slate-100 shadow-sm"
        onClick={() => setZoom(true)}
      >
        <Image
          src={imagemUrl}
          alt={titulo}
          fill
          className="object-cover transition-transform duration-500 hover:scale-105"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
        {/* Indicador zoom */}
        <div className="absolute bottom-3 right-3 rounded-xl bg-white/80 backdrop-blur-sm px-2.5 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600 shadow-sm">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
          Ampliar
        </div>
      </div>

      {/* Lightbox */}
      {zoom && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoom(false)}
        >
          <button
            onClick={() => setZoom(false)}
            className="absolute top-4 right-4 text-white/70 hover:text-white rounded-full p-2 hover:bg-white/10 transition-colors"
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="relative w-full max-w-2xl aspect-square rounded-2xl overflow-hidden">
            <Image
              src={imagemUrl}
              alt={titulo}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
        </div>
      )}
    </>
  );
}
