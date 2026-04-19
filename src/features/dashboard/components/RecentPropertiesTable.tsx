import Link from "next/link";
import type { RecentProperty } from "../types";
import {
  STATUS_LABELS,
  STATUS_CLASSES,
  PROPERTY_TYPE_LABELS,
  formatPrice
} from "@/features/properties/utils";
import type { PropertyStatus, PropertyType } from "@/features/properties/types";

interface Props {
  data: RecentProperty[];
}

export function RecentPropertiesTable({ data }: Props) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center py-8">Sin propiedades recientes.</p>
    );
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm min-w-[480px]">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left py-2 pr-4 font-medium text-slate-500 w-[40%]">Propiedad</th>
            <th className="text-left py-2 pr-4 font-medium text-slate-500 hidden sm:table-cell">Tipo</th>
            <th className="text-left py-2 pr-4 font-medium text-slate-500">Estado</th>
            <th className="text-right py-2 pr-4 font-medium text-slate-500">Precio</th>
            <th className="text-left py-2 font-medium text-slate-500 hidden md:table-cell">Ciudad</th>
          </tr>
        </thead>
        <tbody>
          {data.map((p) => (
            <tr
              key={p.id}
              className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
            >
              <td className="py-2.5 pr-4 max-w-0">
                <Link
                  href={`/properties/${p.id}`}
                  className="font-medium text-slate-800 hover:text-blue-600 line-clamp-1 block"
                >
                  {p.title}
                </Link>
              </td>
              <td className="py-2.5 pr-4 text-slate-500 hidden sm:table-cell whitespace-nowrap">
                {PROPERTY_TYPE_LABELS[p.property_type as PropertyType] ?? p.property_type}
              </td>
              <td className="py-2.5 pr-4 whitespace-nowrap">
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASSES[p.status as PropertyStatus] ?? "bg-slate-100 text-slate-600"}`}
                >
                  {STATUS_LABELS[p.status as PropertyStatus] ?? p.status}
                </span>
              </td>
              <td className="py-2.5 pr-4 text-right text-slate-800 font-medium tabular-nums whitespace-nowrap">
                {formatPrice(p.price_amount, p.price_currency)}
              </td>
              <td className="py-2.5 text-slate-500 hidden md:table-cell">{p.city ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
