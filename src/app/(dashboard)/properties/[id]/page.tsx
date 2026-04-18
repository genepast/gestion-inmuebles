import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  STATUS_LABELS,
  STATUS_CLASSES,
  PROPERTY_TYPE_LABELS,
  OPERATION_TYPE_LABELS,
  formatPrice
} from "@/features/properties/utils";
import { StatusChangeButton } from "@/features/properties/components/StatusChangeButton";
import type { PropertyStatus, PropertyType, OperationType } from "@/features/properties/types";

interface Props {
  params: { id: string };
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(iso));
}

function AttrCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3 space-y-0.5">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function Amenity({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8l3 3 5-5" />
      </svg>
      {label}
    </span>
  );
}

export default async function PropertyDetailPage({ params }: Props) {
  const supabase = createSupabaseServerClient();

  const [{ data: authData }, { data: property, error }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("properties")
      .select(
        "*, property_images(id, storage_path, position, is_primary), property_status_history(id, from_status, to_status, changed_by, reason, changed_at)"
      )
      .eq("id", params.id)
      .single()
  ]);

  if (error || !property) notFound();

  let role = "viewer";
  if (authData.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();
    if (profile?.role === "admin" || profile?.role === "agent") role = profile.role;
  }

  const images = [...(property.property_images ?? [])].sort((a, b) => a.position - b.position);
  const history = [...(property.property_status_history ?? [])].sort(
    (a, b) => new Date(a.changed_at ?? 0).getTime() - new Date(b.changed_at ?? 0).getTime()
  );
  const imageUrls = images.map((img) => ({
    ...img,
    url: supabase.storage.from("property-images").getPublicUrl(img.storage_path).data.publicUrl
  }));

  const statusClass = STATUS_CLASSES[property.status as PropertyStatus] ?? "bg-slate-100 text-slate-700";
  const statusLabel = STATUS_LABELS[property.status as PropertyStatus] ?? property.status;
  const typeLabel = PROPERTY_TYPE_LABELS[property.property_type as PropertyType] ?? property.property_type;
  const opLabel = OPERATION_TYPE_LABELS[property.operation_type as OperationType] ?? property.operation_type;

  return (
    <section className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/properties"
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mb-3"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 4L6 8l4 4" />
          </svg>
          Propiedades
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{property.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusClass}`}>
                {statusLabel}
              </span>
              <span className="text-xs text-slate-400">{typeLabel}</span>
              {property.source === "external" && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                  Sincronizado
                </span>
              )}
            </div>
          </div>
          {role !== "viewer" && (
            <Link
              href={`/properties/${property.id}/edit`}
              className="shrink-0 px-3 py-1.5 rounded-md text-sm font-medium bg-slate-900 text-white hover:bg-slate-700 transition-colors"
            >
              Editar
            </Link>
          )}
        </div>
      </div>

      {/* Price */}
      <div>
        <p className="text-3xl font-bold text-slate-900">
          {formatPrice(property.price_amount, property.price_currency)}
        </p>
        <p className="text-sm text-slate-500 mt-1">{opLabel}</p>
      </div>

      {/* Status transition */}
      {role !== "viewer" && (
        <StatusChangeButton
          propertyId={property.id}
          currentStatus={property.status as PropertyStatus}
          currentTitle={property.title}
          currentPrice={property.price_amount}
          currentCurrency={property.price_currency}
          currentType={property.property_type}
          currentOperation={property.operation_type}
          currentBedrooms={property.bedrooms}
          currentBathrooms={property.bathrooms}
        />
      )}

      {/* Images */}
      {imageUrls.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {imageUrls.map((img, idx) => (
            <div
              key={img.id}
              className={`relative overflow-hidden rounded-lg bg-slate-100 ${
                idx === 0 ? "col-span-2 aspect-video" : "aspect-[4/3]"
              }`}
            >
              <Image src={img.url} alt={`Imagen ${idx + 1}`} fill className="object-cover" />
              {img.is_primary && (
                <span className="absolute top-2 left-2 text-xs bg-black/50 text-white px-2 py-0.5 rounded">
                  Principal
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="h-48 rounded-lg bg-slate-100 flex items-center justify-center">
          <span className="text-sm text-slate-400">Sin imágenes</span>
        </div>
      )}

      {/* Attributes */}
      <div className="space-y-3">
        <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Atributos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <AttrCell label="Ambientes" value={property.bedrooms} />
          <AttrCell label="Baños" value={property.bathrooms} />
          {property.total_area_m2 != null && (
            <AttrCell label="Superficie total" value={`${property.total_area_m2} m²`} />
          )}
          {property.covered_area_m2 != null && (
            <AttrCell label="Sup. cubierta" value={`${property.covered_area_m2} m²`} />
          )}
          {property.parking_spaces != null && (
            <AttrCell label="Cocheras" value={property.parking_spaces} />
          )}
          {property.year_built != null && (
            <AttrCell label="Año" value={property.year_built} />
          )}
        </div>
        {(property.has_pool || property.has_garden || property.has_balcony) && (
          <div className="flex flex-wrap gap-2 pt-1">
            {property.has_pool && <Amenity label="Pileta" />}
            {property.has_garden && <Amenity label="Jardín" />}
            {property.has_balcony && <Amenity label="Balcón" />}
          </div>
        )}
      </div>

      {/* Location */}
      {(property.city ?? property.country) && (
        <div className="space-y-2">
          <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Ubicación</h2>
          <div className="text-sm text-slate-600 space-y-0.5">
            {property.address && <p>{property.address}</p>}
            {property.neighborhood && <p>{property.neighborhood}</p>}
            <p>{[property.city, property.province, property.country].filter(Boolean).join(", ")}</p>
          </div>
        </div>
      )}

      {/* Description */}
      {property.description && (
        <div className="space-y-2">
          <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Descripción</h2>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {property.description}
          </p>
        </div>
      )}

      {/* Status history */}
      {history.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Historial de estado
          </h2>
          <div className="space-y-2">
            {history.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 text-sm">
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded font-medium ${STATUS_CLASSES[entry.from_status as PropertyStatus] ?? "bg-slate-100 text-slate-600"}`}
                  >
                    {STATUS_LABELS[entry.from_status as PropertyStatus] ?? entry.from_status ?? "—"}
                  </span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 4l4 4-4 4" />
                  </svg>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded font-medium ${STATUS_CLASSES[entry.to_status as PropertyStatus] ?? "bg-slate-100 text-slate-600"}`}
                  >
                    {STATUS_LABELS[entry.to_status as PropertyStatus] ?? entry.to_status}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {formatDate(entry.changed_at)}
                  {entry.reason && (
                    <span className="ml-2 text-slate-500 italic">&ldquo;{entry.reason}&rdquo;</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-400">
        <span>Creado: {formatDate(property.created_at)}</span>
        <span>Actualizado: {formatDate(property.updated_at)}</span>
        {property.external_id && <span>ID externo: {property.external_id}</span>}
      </div>
    </section>
  );
}
