"use client";
import { useQuery } from "@tanstack/react-query";
import type { DashboardMetrics } from "../types";

async function fetchMetrics(): Promise<DashboardMetrics> {
  const res = await fetch("/api/dashboard/metrics");
  if (!res.ok) throw new Error("Error al cargar métricas");
  return res.json() as Promise<DashboardMetrics>;
}

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ["dashboard", "metrics"],
    queryFn: fetchMetrics,
    staleTime: 5 * 60 * 1000
  });
}
