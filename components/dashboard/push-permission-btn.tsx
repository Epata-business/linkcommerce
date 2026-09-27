"use client";

import { useEffect, useState, useTransition } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

type Estado = "idle" | "activo" | "negado" | "sem_suporte";

export function PushPermissionBtn() {
  const [estado, setEstado] = useState<Estado>("idle");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setEstado("sem_suporte");
      return;
    }
    if (Notification.permission === "denied") {
      setEstado("negado");
      return;
    }
    navigator.serviceWorker.getRegistration("/sw.js").then((reg) => {
      if (!reg) return;
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) setEstado("activo");
      });
    });
  }, []);

  async function activar() {
    if (!("serviceWorker" in navigator)) return;

    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setEstado("negado");
      return;
    }

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    await fetch("/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub.toJSON()),
    });

    setEstado("activo");
  }

  async function desactivar() {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    if (reg) {
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
    }
    setEstado("idle");
  }

  if (estado === "sem_suporte") return null;

  return (
    <div className="px-3 pb-2">
      {estado === "negado" ? (
        <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600">
          Notificações bloqueadas no browser
        </div>
      ) : estado === "activo" ? (
        <button
          onClick={() => startTransition(desactivar)}
          disabled={isPending}
          className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-green-700 bg-green-50 border border-green-100 hover:bg-green-100 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
          Push activo — desactivar
        </button>
      ) : (
        <button
          onClick={() => startTransition(activar)}
          disabled={isPending}
          className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors"
        >
          <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {isPending ? "A activar…" : "Activar notificações"}
        </button>
      )}
    </div>
  );
}
