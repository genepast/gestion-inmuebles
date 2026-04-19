"use client";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { CityAvgPrice } from "../types";

type Currency = "USD" | "ARS";

const CITY_COLORS = [
  "#818cf8", "#60a5fa", "#34d399", "#fbbf24",
  "#f472b6", "#a78bfa", "#38bdf8", "#4ade80"
];

interface Props {
  dataUsd: CityAvgPrice[];
  dataArs: CityAvgPrice[];
}

export function AvgPriceByCityChart({ dataUsd, dataArs }: Props) {
  const [currency, setCurrency] = useState<Currency>("USD");
  const data = currency === "USD" ? dataUsd : dataArs;

  if (data.length === 0) {
    return (
      <div className="space-y-3">
        <CurrencyToggle value={currency} onChange={setCurrency} />
        <p className="text-sm text-slate-400 text-center py-8">
          Sin datos de precio por ciudad en {currency}.
        </p>
      </div>
    );
  }

  const height = Math.max(200, data.length * 38);

  return (
    <div className="space-y-3">
      <CurrencyToggle value={currency} onChange={setCurrency} />
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 48, left: 8, bottom: 0 }}>
          <XAxis
            type="number"
            tick={{ fontSize: 10 }}
            tickFormatter={(v: number) =>
              v >= 1_000_000
                ? `$${(v / 1_000_000).toFixed(1)}M`
                : v >= 1000
                ? `$${(v / 1000).toFixed(0)}k`
                : `$${v}`
            }
          />
          <YAxis type="category" dataKey="city" tick={{ fontSize: 11 }} width={88} />
          <Tooltip
            formatter={(v) => {
              const num = typeof v === "number" ? v : 0;
              return [`${currency} ${new Intl.NumberFormat("es-AR").format(num)}`, "Precio promedio"] as [string, string];
            }}
            labelFormatter={(label) => String(label)}
          />
          <Bar
            dataKey="avg"
            radius={[0, 4, 4, 0]}
            label={{
              position: "right",
              fontSize: 10,
              formatter: (v: unknown) => {
                const n = typeof v === "number" ? v : 0;
                return n >= 1_000_000
                  ? `$${(n / 1_000_000).toFixed(1)}M`
                  : n >= 1000
                  ? `$${(n / 1000).toFixed(0)}k`
                  : `$${n}`;
              }
            }}
          >
            {data.map((entry, i) => (
              <Cell key={entry.city} fill={CITY_COLORS[i % CITY_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function CurrencyToggle({ value, onChange }: { value: Currency; onChange: (c: Currency) => void }) {
  return (
    <div className="flex gap-1">
      {(["USD", "ARS"] as Currency[]).map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            value === c
              ? "bg-slate-800 text-white"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
