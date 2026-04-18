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
  property: PropertyListItem;
}

export function PropertyCard({ property }: Props) {
  const statusClass =
    STATUS_CLASSES[property.status as PropertyStatus] ?? "bg-slate-100 text-slate-700";
  const statusLabel = STATUS_LABELS[property.status as PropertyStatus] ?? property.status;
  const typeLabel =
    PROPERTY_TYPE_LABELS[property.property_type as PropertyType] ?? property.property_type;
  const opLabel =
    OPERATION_TYPE_LABELS[property.operation_type as OperationType] ?? property.operation_type;

  return (
    <div className="group/card relative rounded-lg border border-slate-200 overflow-hidden hover:border-slate-300 hover:shadow-sm transition-all">
      <Link href={`/properties/${property.id}`} className="block">
        <div className="h-44 bg-slate-100 flex items-center justify-center">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">
            {typeLabel}
          </span>
        </div>
        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-medium text-slate-900 line-clamp-2 group-hover/card:text-slate-700">
              {property.title}
            </h3>
            <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${statusClass}`}>
              {statusLabel}
            </span>
          </div>
          <p className="text-base font-semibold text-slate-900">
            {formatPrice(property.price_amount, property.price_currency)}
          </p>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span>{opLabel}</span>
            {property.city && (
              <>
                <span>·</span>
                <span>{property.city}</span>
              </>
            )}
            {property.province && (
              <>
                <span>,</span>
                <span>{property.province}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-600 pt-1 border-t border-slate-100">
            <span>{property.bedrooms} amb.</span>
            <span>{property.bathrooms} baños</span>
            {property.total_area_m2 && <span>{property.total_area_m2} m²</span>}
          </div>
        </div>
      </Link>

      <Link
        href={`/properties/${property.id}/edit`}
        className="absolute top-2 right-2 hidden group-hover/card:flex items-center gap-1 rounded bg-white/90 px-2 py-1 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-white"
      >
        Editar
      </Link>
    </div>
  );
}
