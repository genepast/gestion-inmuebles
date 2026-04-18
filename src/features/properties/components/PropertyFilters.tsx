"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { PropertyType, PropertyStatus, OperationType } from "../types";
import { PROPERTY_TYPE_LABELS, STATUS_LABELS, OPERATION_TYPE_LABELS } from "../utils";

const PROPERTY_TYPES = Object.entries(PROPERTY_TYPE_LABELS) as [PropertyType, string][];
const STATUSES = Object.entries(STATUS_LABELS) as [PropertyStatus, string][];
const OPERATIONS = Object.entries(OPERATION_TYPE_LABELS) as [OperationType, string][];

const BEDROOM_OPTIONS = [1, 2, 3, 4, 5];
const BATHROOM_OPTIONS = [1, 2, 3, 4];

export function PropertyFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const [textValues, setTextValues] = useState({
    q: searchParams.get("q") ?? "",
    city: searchParams.get("city") ?? "",
    minPrice: searchParams.get("minPrice") ?? "",
    maxPrice: searchParams.get("maxPrice") ?? ""
  });

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");
      for (const [key, value] of Object.entries(updates)) {
        if (!value) params.delete(key);
        else params.set(key, value);
      }
      router.replace(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname]
  );

  function handleSelectChange(key: string, value: string) {
    updateParams({ [key]: value || null });
  }

  function handleTextChange(key: keyof typeof textValues, value: string) {
    setTextValues((prev) => ({ ...prev, [key]: value }));
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams({ [key]: value || null });
    }, 500);
  }

  function clearFilters() {
    clearTimeout(debounceRef.current);
    setTextValues({ q: "", city: "", minPrice: "", maxPrice: "" });
    router.replace(pathname);
  }

  const hasFilters = Array.from(searchParams.keys()).some((k) => !["page", "view"].includes(k));

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <input
          type="text"
          placeholder="Buscar..."
          value={textValues.q}
          onChange={(e) => handleTextChange("q", e.target.value)}
          className="px-3 py-2 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
        />
        <input
          type="text"
          placeholder="Ciudad"
          value={textValues.city}
          onChange={(e) => handleTextChange("city", e.target.value)}
          className="px-3 py-2 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
        />
        <select
          value={searchParams.get("type") ?? ""}
          onChange={(e) => handleSelectChange("type", e.target.value)}
          className="px-3 py-2 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-700"
        >
          <option value="">Todos los tipos</option>
          {PROPERTY_TYPES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={searchParams.get("operation") ?? ""}
          onChange={(e) => handleSelectChange("operation", e.target.value)}
          className="px-3 py-2 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-700"
        >
          <option value="">Todas las operaciones</option>
          {OPERATIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={searchParams.get("status") ?? ""}
          onChange={(e) => handleSelectChange("status", e.target.value)}
          className="px-3 py-2 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-700"
        >
          <option value="">Todos los estados</option>
          {STATUSES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={searchParams.get("minBedrooms") ?? ""}
          onChange={(e) => handleSelectChange("minBedrooms", e.target.value)}
          className="px-3 py-2 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-700"
        >
          <option value="">Ambientes (mín.)</option>
          {BEDROOM_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}+
            </option>
          ))}
        </select>
        <select
          value={searchParams.get("minBathrooms") ?? ""}
          onChange={(e) => handleSelectChange("minBathrooms", e.target.value)}
          className="px-3 py-2 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-700"
        >
          <option value="">Baños (mín.)</option>
          {BATHROOM_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}+
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 shrink-0">Precio:</span>
          <input
            type="number"
            placeholder="Mín"
            value={textValues.minPrice}
            onChange={(e) => handleTextChange("minPrice", e.target.value)}
            className="w-28 px-3 py-1.5 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
          />
          <span className="text-xs text-slate-400">—</span>
          <input
            type="number"
            placeholder="Máx"
            value={textValues.maxPrice}
            onChange={(e) => handleTextChange("maxPrice", e.target.value)}
            className="w-28 px-3 py-1.5 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
          />
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
}
