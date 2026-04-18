"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { PROPERTY_TYPE_LABELS } from "@/features/properties/utils";
import type { PropertyType } from "@/features/properties/types";
import type { TypeCount } from "../types";

interface Props {
  data: TypeCount[];
}

export function TypeDistributionChart({ data }: Props) {
  const chartData = data.map((d) => ({
    ...d,
    label: PROPERTY_TYPE_LABELS[d.type as PropertyType] ?? d.type
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip formatter={(v) => [v, "Propiedades"]} />
        <Bar dataKey="count" fill="#60a5fa" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
