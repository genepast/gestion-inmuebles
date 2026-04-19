"use client";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
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
  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({
      ...d,
      name: STATUS_LABELS[d.status as PropertyStatus] ?? d.status
    }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="count"
          nameKey="name"
          cx="50%"
          cy="45%"
          outerRadius={75}
          labelLine={false}
        >
          {chartData.map((entry) => (
            <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#94a3b8"} />
          ))}
        </Pie>
        <Tooltip formatter={(v, name) => [v, name]} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
