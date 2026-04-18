"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PropertyStatus } from "../types";
import { STATUS_LABELS } from "../utils";

const VALID_TRANSITIONS: Record<PropertyStatus, readonly PropertyStatus[]> = {
  draft: ["available"],
  available: ["reserved", "cancelled"],
  reserved: ["sold", "rented", "cancelled"],
  sold: [],
  rented: [],
  cancelled: []
};

const TRANSITION_LABELS: Record<PropertyStatus, string> = {
  available: "Publicar",
  reserved: "Reservar",
  sold: "Marcar vendido",
  rented: "Marcar alquilado",
  cancelled: "Cancelar publicación",
  draft: "Volver a borrador"
};

const TRANSITION_STYLES: Partial<Record<PropertyStatus, string>> = {
  available: "bg-green-600 text-white hover:bg-green-700",
  reserved: "bg-amber-500 text-white hover:bg-amber-600",
  sold: "bg-blue-600 text-white hover:bg-blue-700",
  rented: "bg-purple-600 text-white hover:bg-purple-700",
  cancelled: "bg-red-500 text-white hover:bg-red-600"
};

interface Props {
  propertyId: string;
  currentStatus: PropertyStatus;
  currentTitle: string;
  currentPrice: number;
  currentCurrency: string;
  currentType: string;
  currentOperation: string;
  currentBedrooms: number;
  currentBathrooms: number;
}

export function StatusChangeButton({
  propertyId,
  currentStatus,
  currentTitle,
  currentPrice,
  currentCurrency,
  currentType,
  currentOperation,
  currentBedrooms,
  currentBathrooms
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<PropertyStatus | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transitions = VALID_TRANSITIONS[currentStatus];
  if (transitions.length === 0) return null;

  async function confirm() {
    if (!pending) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: pending,
          reason: reason.trim() || undefined,
          title: currentTitle,
          price_amount: currentPrice,
          price_currency: currentCurrency,
          property_type: currentType,
          operation_type: currentOperation,
          bedrooms: currentBedrooms,
          bathrooms: currentBathrooms,
          has_pool: false,
          has_garden: false,
          has_balcony: false
        })
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Error al cambiar estado");
        setLoading(false);
        return;
      }
      setPending(null);
      setReason("");
      router.refresh();
    } catch {
      setError("Error de red");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {!pending ? (
        <div className="flex flex-wrap gap-2">
          {transitions.map((next) => (
            <button
              key={next}
              onClick={() => { setPending(next); setError(null); }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                TRANSITION_STYLES[next] ?? "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}
            >
              {TRANSITION_LABELS[next]}
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 p-4 space-y-3 bg-slate-50">
          <p className="text-sm text-slate-700">
            Cambiar estado a{" "}
            <span className="font-semibold">{STATUS_LABELS[pending]}</span>
            {". "}¿Confirmás?
          </p>
          <textarea
            placeholder="Motivo (opcional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={confirm}
              disabled={loading}
              className="px-4 py-1.5 rounded-md text-sm font-medium bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Guardando..." : "Confirmar"}
            </button>
            <button
              onClick={() => { setPending(null); setReason(""); setError(null); }}
              disabled={loading}
              className="px-4 py-1.5 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
