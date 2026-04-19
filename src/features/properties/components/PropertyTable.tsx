import Link from "next/link";
import type { PropertyListItem, PropertyStatus, PropertyType, OperationType } from "../types";
import {
  formatPrice,
  PROPERTY_TYPE_LABELS,
  OPERATION_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_CLASSES
} from "../utils";

interface Props {
  properties: PropertyListItem[];
  role?: string;
}

export function PropertyTable({ properties, role = "viewer" }: Props) {
  if (properties.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500 text-sm">
        No se encontraron propiedades con los filtros seleccionados.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-slate-700">Propiedad</th>
            <th className="text-left px-4 py-3 font-medium text-slate-700 hidden md:table-cell">
              Tipo / Op.
            </th>
            <th className="text-left px-4 py-3 font-medium text-slate-700">Estado</th>
            <th className="text-right px-4 py-3 font-medium text-slate-700">Precio</th>
            <th className="text-left px-4 py-3 font-medium text-slate-700 hidden lg:table-cell">
              Ubicación
            </th>
            <th className="text-center px-4 py-3 font-medium text-slate-700 hidden md:table-cell">
              Amb.
            </th>
            <th className="text-right px-4 py-3 font-medium text-slate-700 hidden lg:table-cell">
              Superficie
            </th>
            {role !== "viewer" && <th className="px-4 py-3" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {properties.map((p) => {
            const statusClass =
              STATUS_CLASSES[p.status as PropertyStatus] ?? "bg-slate-100 text-slate-700";
            const statusLabel = STATUS_LABELS[p.status as PropertyStatus] ?? p.status;
            const typeLabel =
              PROPERTY_TYPE_LABELS[p.property_type as PropertyType] ?? p.property_type;
            const opLabel =
              OPERATION_TYPE_LABELS[p.operation_type as OperationType] ?? p.operation_type;

            return (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <Link
                    href={`/properties/${p.id}`}
                    className="font-medium text-slate-900 hover:text-slate-700 line-clamp-1"
                  >
                    {p.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                  {typeLabel}
                  <span className="text-slate-400 mx-1">·</span>
                  {opLabel}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusClass}`}
                  >
                    {statusLabel}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-900">
                  {formatPrice(p.price_amount, p.price_currency)}
                </td>
                <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">
                  {[p.city, p.province].filter(Boolean).join(", ")}
                </td>
                <td className="px-4 py-3 text-center text-slate-600 hidden md:table-cell">
                  {p.bedrooms}
                </td>
                <td className="px-4 py-3 text-right text-slate-600 hidden lg:table-cell">
                  {p.total_area_m2 ? `${p.total_area_m2} m²` : "—"}
                </td>
                {role !== "viewer" && (
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/properties/${p.id}/edit`}
                      className="text-xs text-slate-500 hover:text-slate-900"
                    >
                      Editar
                    </Link>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
