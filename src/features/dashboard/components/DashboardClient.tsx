"use client";
import { useDashboardMetrics } from "../hooks/useDashboardMetrics";
import { MetricCard } from "./MetricCard";
import { StatusDistributionChart } from "./StatusDistributionChart";
import { TypeDistributionChart } from "./TypeDistributionChart";
import { WeeklyIncomeChart } from "./WeeklyIncomeChart";
import { AvgPriceByCityChart } from "./AvgPriceByCityChart";
import { RecentPropertiesTable } from "./RecentPropertiesTable";
import { DashboardSkeleton } from "./DashboardSkeleton";
import Link from "next/link";

function formatCompact(n: number) {
  return new Intl.NumberFormat("es-AR", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function DashboardClient() {
  const { data, isPending, isError } = useDashboardMetrics();

  if (isPending) return <DashboardSkeleton />;
  if (isError) return <p className="text-sm text-red-600">Error al cargar métricas.</p>;

  const available = data.byStatus.find((s) => s.status === "available")?.count ?? 0;
  const reserved = data.byStatus.find((s) => s.status === "reserved")?.count ?? 0;
  const soldRented =
    (data.byStatus.find((s) => s.status === "sold")?.count ?? 0) +
    (data.byStatus.find((s) => s.status === "rented")?.count ?? 0);
  const totalUsd = data.weeklyIncome.reduce((sum, w) => sum + w.usd, 0);
  const totalArs = data.weeklyIncome.reduce((sum, w) => sum + w.ars, 0);
  const hasVolume = totalUsd > 0 || totalArs > 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard label="Total stock" value={data.total} sub="propiedades" />
        <MetricCard label="Disponibles" value={available} sub="en oferta activa" />
        <MetricCard label="Reservadas" value={reserved} sub="en proceso" />
        <MetricCard
          label="Vendidas / Alquiladas"
          value={soldRented}
          sub="acumuladas"
        />
      </div>

      {/* Volumen sincronizado — solo visible si hay datos */}
      {hasVolume && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {totalUsd > 0 && (
            <MetricCard
              label="Valor sincronizado USD (13 sem.)"
              value={`USD ${formatCompact(totalUsd)}`}
              sub="propiedades externas · precio acumulado"
            />
          )}
          {totalArs > 0 && (
            <MetricCard
              label="Valor sincronizado ARS (13 sem.)"
              value={`ARS ${formatCompact(totalArs)}`}
              sub="propiedades externas · precio acumulado"
            />
          )}
        </div>
      )}

      {/* Estado + Tipo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700">Estado comercial</h2>
          <StatusDistributionChart data={data.byStatus} />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700">Distribución por tipo</h2>
          <TypeDistributionChart data={data.byType} />
        </div>
      </div>

      {/* Precio promedio por ciudad */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Precio promedio por ciudad</h2>
          <span className="text-xs text-slate-400">top 8</span>
        </div>
        <AvgPriceByCityChart
          dataUsd={data.avgPriceByCityUsd}
          dataArs={data.avgPriceByCityArs}
        />
      </div>

      {/* Ingresos semanales */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">
          Valor de propiedades sincronizadas · por semana · últimos 3 meses
        </h2>
        <WeeklyIncomeChart data={data.weeklyIncome} />
      </div>

      {/* Últimas propiedades */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Últimas propiedades publicadas</h2>
          <Link
            href="/properties"
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Ver todas →
          </Link>
        </div>
        <RecentPropertiesTable data={data.recentProperties} />
      </div>
    </div>
  );
}
