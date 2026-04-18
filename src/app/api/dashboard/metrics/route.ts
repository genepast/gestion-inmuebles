import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DashboardMetrics } from "@/features/dashboard/types";

function getWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function formatWeekLabel(weekKey: string): string {
  const parts = weekKey.split("-W");
  const year = parts[0] ?? "";
  const week = parts[1] ?? "0";
  return `S${parseInt(week)}/${year.slice(2)}`;
}

export async function GET() {
  const supabase = createSupabaseServerClient();

  const { data: props, error } = await supabase
    .from("properties")
    .select("status, property_type, price_amount, price_currency, updated_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const allProperties = props ?? [];

  const statusMap = new Map<string, number>();
  const typeMap = new Map<string, number>();
  for (const p of allProperties) {
    statusMap.set(p.status, (statusMap.get(p.status) ?? 0) + 1);
    typeMap.set(p.property_type, (typeMap.get(p.property_type) ?? 0) + 1);
  }

  const now = new Date();
  const weekMap = new Map<string, number>();
  for (let i = 12; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    weekMap.set(getWeekKey(d), 0);
  }

  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 91);

  for (const p of allProperties) {
    if (!p.updated_at || p.price_currency !== "USD") continue;
    if (!["sold", "rented"].includes(p.status)) continue;
    const date = new Date(p.updated_at);
    if (date < cutoff) continue;
    const key = getWeekKey(date);
    weekMap.set(key, (weekMap.get(key) ?? 0) + p.price_amount);
  }

  const metrics: DashboardMetrics = {
    total: allProperties.length,
    byStatus: Array.from(statusMap.entries()).map(([status, count]) => ({ status, count })),
    byType: Array.from(typeMap.entries()).map(([type, count]) => ({ type, count })),
    weeklyIncome: Array.from(weekMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, amount]) => ({ week, label: formatWeekLabel(week), amount }))
  };

  return NextResponse.json(metrics);
}
