"use client";
import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import type { WeeklyIncome } from "../types";

type Currency = "USD" | "ARS";

interface Props {
  data: WeeklyIncome[];
}

const CURRENCY_CONFIG: Record<Currency, { color: string; label: string }> = {
  USD: { color: "#3b82f6", label: "USD" },
  ARS: { color: "#10b981", label: "ARS" }
};

export function WeeklyIncomeChart({ data }: Props) {
  const [currency, setCurrency] = useState<Currency>("USD");
  const { color } = CURRENCY_CONFIG[currency];
  const dataKey = currency === "USD" ? "usd" : "ars";
  const gradientId = `incomeGradient-${currency}`;

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {(["USD", "ARS"] as Currency[]).map((c) => (
          <button
            key={c}
            onClick={() => setCurrency(c)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              currency === c
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis
            tick={{ fontSize: 10 }}
            tickFormatter={(v: number) =>
              v >= 1_000_000
                ? `$${(v / 1_000_000).toFixed(1)}M`
                : v >= 1000
                ? `$${(v / 1000).toFixed(0)}k`
                : `$${v}`
            }
          />
          <Tooltip
            formatter={(v) => {
              const num = typeof v === "number" ? v : 0;
              return [`${currency} ${new Intl.NumberFormat("es-AR").format(num)}`, "Volumen"];
            }}
            labelFormatter={(l) => `Semana: ${l}`}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
