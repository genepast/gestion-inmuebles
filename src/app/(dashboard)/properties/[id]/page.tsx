import { notFound } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const PropertyMap = dynamic(
  () => import("@/components/PropertyMap").then((m) => m.PropertyMap),
  { ssr: false }
);
import {
  STATUS_LABELS,
  STATUS_CLASSES,
  PROPERTY_TYPE_LABELS,
  OPERATION_TYPE_LABELS,
  formatPrice
} from "@/features/properties/utils";
import { StatusChangeButton } from "@/features/properties/components/StatusChangeButton";
import { PropertyImageCarousel } from "@/features/properties/components/PropertyImageCarousel";
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

  const profileIdsToResolve = [
    ...new Set([
      ...history.map((h) => h.changed_by).filter(Boolean),
      property.assigned_agent_id ?? null
    ].filter(Boolean))
  ] as string[];

  const agentNameMap = new Map<string, string>();
  if (profileIdsToResolve.length > 0) {
    const adminClient = createSupabaseAdminClient();
    const { data: profiles } = await adminClient
      .from("profiles")
      .select("id, full_name")
      .in("id", profileIdsToResolve);
    for (const p of profiles ?? []) {
      agentNameMap.set(p.id, p.full_name ?? "Usuario desconocido");
    }
  }

  const assignedAgentName = property.assigned_agent_id
    ? (agentNameMap.get(property.assigned_agent_id) ?? "Usuario desconocido")
    : null;

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
              {property.source === "external" && role !== "viewer" && (
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
        />
      )}

      {/* Images */}
      {imageUrls.length > 0 ? (
        <div className="space-y-2">
          <PropertyImageCarousel images={imageUrls} />
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
          {property.latitude != null && property.longitude != null && (
            <div className="pt-2">
              <PropertyMap
                lat={property.latitude}
                lng={property.longitude}
                label={property.address ?? property.title}
              />
            </div>
          )}
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
        <div className="space-y-4">
          <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Historial de estado
          </h2>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[11px] top-3 bottom-3 w-px bg-slate-200" />

            <div className="space-y-0">
              {history.map((entry, idx) => {
                const agentName = entry.changed_by
                  ? (agentNameMap.get(entry.changed_by) ?? "Usuario desconocido")
                  : "Sistema";
                const isLast = idx === history.length - 1;
                return (
                  <div key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
                    {/* Dot */}
                    <div className={`relative z-10 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                      isLast
                        ? "border-slate-900 bg-white"
                        : "border-slate-300 bg-white"
                    }`}>
                      <div className={`h-2 w-2 rounded-full ${isLast ? "bg-slate-900" : "bg-slate-300"}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5 space-y-1.5">
                      {/* Badges row */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {entry.from_status && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASSES[entry.from_status as PropertyStatus] ?? "bg-slate-100 text-slate-600"}`}>
                            {STATUS_LABELS[entry.from_status as PropertyStatus] ?? entry.from_status}
                          </span>
                        )}
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400 shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 4l4 4-4 4" />
                        </svg>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASSES[entry.to_status as PropertyStatus] ?? "bg-slate-100 text-slate-600"}`}>
                          {STATUS_LABELS[entry.to_status as PropertyStatus] ?? entry.to_status}
                        </span>
                      </div>

                      {/* Agent + date */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <svg width="11" height="11" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a5.75 5.75 0 11-11.5 0 5.75 5.75 0 0111.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0110 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                          </svg>
                          <span className="font-medium text-slate-700">{agentName}</span>
                        </span>
                        <span className="text-slate-400">{formatDate(entry.changed_at)}</span>
                      </div>

                      {/* Reason */}
                      {entry.reason && (
                        <p className="text-xs text-slate-500 italic bg-slate-50 rounded px-2 py-1 border border-slate-100">
                          &ldquo;{entry.reason}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Metadata */}
      {role !== "viewer" && (
        <div className="pt-4 border-t border-slate-100 space-y-2">
          {assignedAgentName && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Agente asignado
              </span>
              <span className="flex items-center gap-1.5 text-sm text-slate-700">
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a5.75 5.75 0 11-11.5 0 5.75 5.75 0 0111.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0110 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                {assignedAgentName}
              </span>
            </div>
          )}
          <div className="flex flex-wrap gap-4 text-xs text-slate-400">
            <span>Creado: {formatDate(property.created_at)}</span>
            <span>Actualizado: {formatDate(property.updated_at)}</span>
            {property.external_id && <span>ID externo: {property.external_id}</span>}
          </div>
        </div>
      )}
    </section>
  );
}
