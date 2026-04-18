import { DashboardClient } from "@/features/dashboard/components/DashboardClient";

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Resumen del stock y actividad comercial</p>
      </div>
      <DashboardClient />
    </section>
  );
}
