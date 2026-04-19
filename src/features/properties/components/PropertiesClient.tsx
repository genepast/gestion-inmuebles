"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useProperties, useDelayedLoading } from "../hooks/useProperties";
import { PropertyFilters } from "./PropertyFilters";
import { PropertyCard } from "./PropertyCard";
import { PropertyTable } from "./PropertyTable";
import { PropertiesGridSkeleton, PropertiesTableSkeleton } from "./PropertySkeletons";
import { Pagination } from "./Pagination";
import type { PropertyFilters as Filters, SortOption } from "../types";

const PAGE_SIZE = 12;

export function PropertiesClient({ role = "viewer" }: { role?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const view = (searchParams.get("view") as "grid" | "table") ?? "grid";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));

  const filters: Filters = {
    page,
    pageSize: PAGE_SIZE,
    q: searchParams.get("q") ?? undefined,
    city: searchParams.get("city") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    operation: searchParams.get("operation") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    minBedrooms: searchParams.get("minBedrooms") ? Number(searchParams.get("minBedrooms")) : undefined,
    minBathrooms: searchParams.get("minBathrooms") ? Number(searchParams.get("minBathrooms")) : undefined,
    sort: (searchParams.get("sort") as SortOption) ?? undefined
  };

  const { data, isLoading, isFetching, isError } = useProperties(filters);
  const showSkeleton = useDelayedLoading(isLoading);

  function toggleView(newView: "grid" | "table") {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", newView);
    router.replace(`${pathname}?${params.toString()}`);
  }

  function handleSort(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (value) params.set("sort", value);
    else params.delete("sort");
    router.replace(`${pathname}?${params.toString()}`);
  }

  const properties = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Propiedades</h1>
          <p className="text-sm text-slate-500 mt-0.5 h-5">
            {data
              ? `${data.total} ${data.total === 1 ? "propiedad" : "propiedades"}`
              : null}
            {isFetching && !isLoading && (
              <span className="ml-2 text-xs text-slate-400">actualizando...</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <select
            value={filters.sort ?? ""}
            onChange={(e) => handleSort(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-md border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="">Más recientes</option>
            <option value="price_amount:asc">Precio: menor a mayor</option>
            <option value="price_amount:desc">Precio: mayor a menor</option>
            <option value="total_area_m2:desc">Superficie: mayor a menor</option>
          </select>
          <div className="flex rounded-md border border-slate-200 overflow-hidden text-sm">
            <button
              onClick={() => toggleView("grid")}
              className={`px-3 py-1.5 transition-colors ${
                view === "grid"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              ⊞ Grid
            </button>
            <button
              onClick={() => toggleView("table")}
              className={`px-3 py-1.5 transition-colors border-l border-slate-200 ${
                view === "table"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              ☰ Lista
            </button>
          </div>
          {role !== "viewer" && (
            <a
              href={`/api/properties/export?${new URLSearchParams(
                Object.entries({
                  q: filters.q,
                  city: filters.city,
                  type: filters.type,
                  operation: filters.operation,
                  status: filters.status,
                  minPrice: filters.minPrice?.toString(),
                  maxPrice: filters.maxPrice?.toString(),
                  minBedrooms: filters.minBedrooms?.toString(),
                  minBathrooms: filters.minBathrooms?.toString(),
                  sort: filters.sort
                }).filter(([, v]) => v !== undefined) as [string, string][]
              ).toString()}`}
              className="px-3 py-1.5 text-sm border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50 transition-colors"
            >
              Exportar CSV
            </a>
          )}
          {role !== "viewer" && (
            <a
              href="/properties/new"
              className="px-4 py-2 text-sm bg-slate-900 text-white rounded-md hover:bg-slate-700 transition-colors"
            >
              + Nueva
            </a>
          )}
        </div>
      </div>

      <PropertyFilters />

      {isError && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          Error al cargar propiedades. Por favor, intentá de nuevo.
        </div>
      )}

      <div className={isFetching && !isLoading ? "opacity-60 transition-opacity" : ""}>
        {showSkeleton ? (
          view === "grid" ? (
            <PropertiesGridSkeleton count={PAGE_SIZE} />
          ) : (
            <PropertiesTableSkeleton count={PAGE_SIZE} />
          )
        ) : isLoading ? null : properties.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm">
            No se encontraron propiedades con los filtros seleccionados.
          </div>
        ) : view === "grid" ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} role={role} />
            ))}
          </div>
        ) : (
          <PropertyTable properties={properties} role={role} />
        )}
      </div>

      {data && data.totalPages > 1 && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          pageSize={data.pageSize}
        />
      )}
    </div>
  );
}
