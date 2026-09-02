"use client";

import { useEffect } from "react";

// Disparado no cliente — garante que é uma visita real de browser,
// não uma renderização de Server Component (que pode ser cacheada).
export function StoreTracker({ lojaId }: { lojaId: string }) {
  useEffect(() => {
    // sendBeacon não bloqueia a página e é ignorado por muitos crawlers
    const payload = JSON.stringify({ tipo: "store_view", lojaId });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
    } else {
      fetch("/api/track", { method: "POST", body: payload, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
    }
  // Corre uma única vez por montagem de página — sem dependências
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
