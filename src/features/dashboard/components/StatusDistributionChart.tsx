"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { STATUS_LABELS } from "@/features/properties/utils";
import type { PropertyStatus } from "@/features/properties/types";
import type { StatusCount } from "../types";

const STATUS_COLORS: Record<string, string> = {
  draft: "#94a3b8",
  available: "#4ade80",
  reserved: "#fbbf24",
  sold: "#60a5fa",
  rented: "#a78bfa",
  cancelled: "#f87171"
};

interface Props {
  data: StatusCount[];
}

export function StatusDistributionChart({ data }: Props) {
  const chartData = data.map((d) => ({
    ...d,
    label: STATUS_LABELS[d.status as PropertyStatus] ?? d.status
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip formatter={(v) => [v, "Propiedades"]} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {chartData.map((entry) => (
            <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#94a3b8"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
