"use client";
import { useDashboardMetrics } from "../hooks/useDashboardMetrics";
import { MetricCard } from "./MetricCard";
import { StatusDistributionChart } from "./StatusDistributionChart";
import { TypeDistributionChart } from "./TypeDistributionChart";
import { WeeklyIncomeChart } from "./WeeklyIncomeChart";
import { DashboardSkeleton } from "./DashboardSkeleton";

export function DashboardClient() {
  const { data, isPending, isError } = useDashboardMetrics();

  if (isPending) return <DashboardSkeleton />;
  if (isError) return <p className="text-sm text-red-600">Error al cargar métricas.</p>;

  const available = data.byStatus.find((s) => s.status === "available")?.count ?? 0;
  const sold = data.byStatus.find((s) => s.status === "sold")?.count ?? 0;
  const totalUsd = data.weeklyIncome.reduce((sum, w) => sum + w.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard label="Total" value={data.total} sub="propiedades" />
        <MetricCard label="Disponibles" value={available} sub="en stock" />
        <MetricCard label="Vendidas / Alquiladas" value={sold} sub="acumuladas" />
        <MetricCard
          label="Volumen (13 sem.)"
          value={`USD ${new Intl.NumberFormat("es-AR", { notation: "compact" }).format(totalUsd)}`}
          sub="solo USD · sin conversión"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-slate-200 p-4 space-y-3">
          <h2 className="text-sm font-medium text-slate-700">Distribución por estado</h2>
          <StatusDistributionChart data={data.byStatus} />
        </div>
        <div className="rounded-lg border border-slate-200 p-4 space-y-3">
          <h2 className="text-sm font-medium text-slate-700">Distribución por tipo</h2>
          <TypeDistributionChart data={data.byType} />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-700">
            Volumen semanal · sold + rented · últimas 13 semanas
          </h2>
          <span className="text-xs text-slate-400">Solo USD</span>
        </div>
        <WeeklyIncomeChart data={data.weeklyIncome} />
      </div>
    </div>
  );
}
