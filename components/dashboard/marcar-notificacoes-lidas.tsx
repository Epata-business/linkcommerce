"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function MarcarTodasLidasButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function marcar() {
    startTransition(async () => {
      await fetch("/api/notificacoes", { method: "PATCH" });
      router.refresh();
    });
  }

  return (
    <button
      onClick={marcar}
      disabled={isPending}
      className="text-sm font-semibold text-blue-500 hover:text-blue-700 disabled:opacity-50 transition-colors"
    >
      {isPending ? "A marcar..." : "Marcar todas lidas"}
    </button>
  );
}
