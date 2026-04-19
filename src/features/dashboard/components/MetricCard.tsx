interface Props {
  label: string;
  value: number | string;
  sub?: string;
  value2?: number | string;
  sub2?: string;
}

export function MetricCard({ label, value, sub, value2, sub2 }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-3xl font-bold text-slate-900 tabular-nums">{value}</p>
      {value2 && (
        <p className="text-base font-semibold text-slate-500 tabular-nums">{value2}</p>
      )}
      {sub && <p className="text-xs text-slate-400">{sub2 ?? sub}</p>}
    </div>
  );
}
