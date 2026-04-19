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

function buildCityAvgMap(
  properties: { city: string | null; price_amount: number; price_currency: string }[],
  currency: string
): { city: string; avg: number; count: number }[] {
  const map = new Map<string, { total: number; count: number }>();
  for (const p of properties) {
    if (!p.city || p.price_currency !== currency) continue;
    const existing = map.get(p.city) ?? { total: 0, count: 0 };
    map.set(p.city, { total: existing.total + p.price_amount, count: existing.count + 1 });
  }
  return Array.from(map.entries())
    .map(([city, { total, count }]) => ({ city, avg: Math.round(total / count), count }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 8);
}

export async function GET() {
  const supabase = createSupabaseServerClient();

  const { data: props, error } = await supabase
    .from("properties")
    .select("id, title, status, property_type, price_amount, price_currency, city, updated_at, created_at, source");

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
  const weekKeys: string[] = [];
  for (let i = 12; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    weekKeys.push(getWeekKey(d));
  }
  const weekMapUsd = new Map<string, number>(weekKeys.map((k) => [k, 0]));
  const weekMapArs = new Map<string, number>(weekKeys.map((k) => [k, 0]));

  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 91);

  for (const p of allProperties) {
    if (!p.created_at || p.source !== "external") continue;
    const date = new Date(p.created_at);
    if (date < cutoff) continue;
    const key = getWeekKey(date);
    if (p.price_currency === "USD") {
      weekMapUsd.set(key, (weekMapUsd.get(key) ?? 0) + p.price_amount);
    } else if (p.price_currency === "ARS") {
      weekMapArs.set(key, (weekMapArs.get(key) ?? 0) + p.price_amount);
    }
  }

  const recentProperties = [...allProperties]
    .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      title: p.title,
      property_type: p.property_type,
      status: p.status,
      price_amount: p.price_amount,
      price_currency: p.price_currency,
      city: p.city,
      created_at: p.created_at ?? ""
    }));

  const metrics: DashboardMetrics = {
    total: allProperties.length,
    byStatus: Array.from(statusMap.entries()).map(([status, count]) => ({ status, count })),
    byType: Array.from(typeMap.entries()).map(([type, count]) => ({ type, count })),
    weeklyIncome: weekKeys
      .sort((a, b) => a.localeCompare(b))
      .map((week) => ({
        week,
        label: formatWeekLabel(week),
        usd: weekMapUsd.get(week) ?? 0,
        ars: weekMapArs.get(week) ?? 0
      })),
    avgPriceByCityUsd: buildCityAvgMap(allProperties, "USD"),
    avgPriceByCityArs: buildCityAvgMap(allProperties, "ARS"),
    recentProperties
  };

  return NextResponse.json(metrics);
}
