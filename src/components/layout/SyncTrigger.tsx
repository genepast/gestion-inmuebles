"use client";
import { useState } from "react";

type SyncState = "idle" | "loading" | "success" | "error";

export function SyncTrigger() {
  const [state, setState] = useState<SyncState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSync() {
    setState("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/sync/properties", { method: "POST" });
      const data = (await res.json()) as { items_created?: number; items_updated?: number; error?: string };
      if (res.ok) {
        setState("success");
        setMessage(`+${data.items_created ?? 0} creadas · ${data.items_updated ?? 0} actualizadas`);
      } else {
        setState("error");
        setMessage(data.error ?? "Error al sincronizar");
      }
    } catch {
      setState("error");
      setMessage("Error de red");
    }
    setTimeout(() => {
      setState("idle");
      setMessage(null);
    }, 5000);
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleSync}
        disabled={state === "loading"}
        className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50 transition-colors w-full"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className={state === "loading" ? "animate-spin" : ""}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
        {state === "loading" ? "Sincronizando..." : "Sincronizar"}
      </button>
      {message && (
        <p className={`text-xs px-3 ${state === "success" ? "text-green-600" : "text-red-500"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
