"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { propertyFormSchema, type PropertyFormValues } from "../schemas/property.schema";
import { useCreateProperty, useUpdateProperty } from "../hooks/usePropertyMutations";
import { ImageUploader, type ImageEntry } from "./ImageUploader";
import {
  PROPERTY_TYPE_LABELS,
  OPERATION_TYPE_LABELS,
  STATUS_LABELS
} from "../utils";
import { geocodeAddress } from "@/lib/geocoding";

interface PropertyImage {
  id: string;
  storage_path: string;
  position: number;
  is_primary: boolean | null;
}

interface PropertyWithImages {
  id: string;
  title: string;
  description: string | null;
  property_type: string;
  operation_type: string;
  status: string;
  price_amount: number;
  price_currency: string;
  country: string | null;
  province: string | null;
  city: string | null;
  neighborhood: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  bedrooms: number;
  bathrooms: number;
  total_area_m2: number | null;
  covered_area_m2: number | null;
  parking_spaces: number | null;
  year_built: number | null;
  has_pool: boolean | null;
  has_garden: boolean | null;
  has_balcony: boolean | null;
  property_images: PropertyImage[];
}

interface Props {
  property?: PropertyWithImages;
}

async function syncImages(propertyId: string, images: ImageEntry[]) {
  const supabase = createSupabaseBrowserClient();

  const resolved = await Promise.all(
    images.map(async (img, position) => {
      if (!img.isExisting && img.file) {
        const ext = img.file.name.split(".").pop() ?? "jpg";
        const path = `${propertyId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from("property-images")
          .upload(path, img.file, { upsert: false });
        if (error) return null;
        return { storage_path: path, position, is_primary: img.isPrimary };
      }
      if (img.storagePath) {
        return { storage_path: img.storagePath, position, is_primary: img.isPrimary };
      }
      return null;
    })
  );

  const rows = resolved.filter(Boolean) as {
    storage_path: string;
    position: number;
    is_primary: boolean;
  }[];

  await supabase.from("property_images").delete().eq("property_id", propertyId);

  if (rows.length > 0) {
    await supabase
      .from("property_images")
      .insert(rows.map((r) => ({ ...r, property_id: propertyId })));
  }
}

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const labelClass = "block text-sm font-medium text-slate-700";
const errorClass = "mt-1 text-xs text-red-600";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-200 pb-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{children}</h2>
    </div>
  );
}

export function PropertyForm({ property }: Props) {
  const router = useRouter();
  const createMutation = useCreateProperty();
  const updateMutation = useUpdateProperty();
  const [serverError, setServerError] = useState<string | null>(null);
  const [imageEntries, setImageEntries] = useState<ImageEntry[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeStatus, setGeocodeStatus] = useState<"ok" | "error" | null>(null);

  // useForm without a type param to avoid TS2719 resolver type conflict (RHF v7 + @hookform/resolvers v5 + Zod v4 transform schemas).
  // zodResolver still validates on every change; we re-parse in onSubmit to get the typed output.
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: property
      ? {
          title: property.title,
          description: property.description ?? "",
          property_type: property.property_type as PropertyFormValues["property_type"],
          operation_type: property.operation_type as PropertyFormValues["operation_type"],
          status: property.status as PropertyFormValues["status"],
          price_amount: property.price_amount,
          price_currency: property.price_currency as PropertyFormValues["price_currency"],
          country: property.country ?? "",
          province: property.province ?? "",
          city: property.city ?? "",
          neighborhood: property.neighborhood ?? "",
          address: property.address ?? "",
          latitude: property.latitude ?? undefined,
          longitude: property.longitude ?? undefined,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          total_area_m2: property.total_area_m2 ?? undefined,
          covered_area_m2: property.covered_area_m2 ?? undefined,
          parking_spaces: property.parking_spaces ?? undefined,
          year_built: property.year_built ?? undefined,
          has_pool: property.has_pool ?? false,
          has_garden: property.has_garden ?? false,
          has_balcony: property.has_balcony ?? false
        }
      : {
          property_type: "apartment",
          operation_type: "sale",
          status: "draft",
          price_currency: "USD",
          country: "Argentina",
          bedrooms: 0,
          bathrooms: 0,
          has_pool: false,
          has_garden: false,
          has_balcony: false
        }
  });

  const onSubmit = handleSubmit(async (rawValues) => {
    setServerError(null);
    const parsed = propertyFormSchema.safeParse(rawValues);
    if (!parsed.success) {
      setServerError(parsed.error.issues[0]?.message ?? "Error de validación");
      return;
    }
    const values: PropertyFormValues = parsed.data;
    try {
      if (property) {
        await updateMutation.mutateAsync({ id: property.id, values });
        await syncImages(property.id, imageEntries);
      } else {
        const created = await createMutation.mutateAsync(values);
        await syncImages(created.id, imageEntries);
      }
      router.push("/properties");
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Error desconocido");
    }
  });

  const isLoading = isSubmitting || createMutation.isPending || updateMutation.isPending;

  async function handleGeocode() {
    setIsGeocoding(true);
    setGeocodeStatus(null);
    const { address, city, province, country } = getValues();
    const result = await geocodeAddress({ address, city, province, country });
    if (result) {
      setValue("latitude", result.lat);
      setValue("longitude", result.lng);
      setGeocodeStatus("ok");
    } else {
      setGeocodeStatus("error");
    }
    setIsGeocoding(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {/* Datos básicos */}
      <div className="space-y-4">
        <SectionTitle>Datos básicos</SectionTitle>

        <div>
          <label className={labelClass}>Título *</label>
          <input {...register("title")} className={inputClass} placeholder="Ej: Departamento 2 ambientes en Palermo" />
          {errors.title && <p className={errorClass}>{errors.title.message}</p>}
        </div>

        <div>
          <label className={labelClass}>Descripción</label>
          <textarea
            {...register("description")}
            rows={3}
            className={inputClass}
            placeholder="Descripción detallada de la propiedad…"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Tipo de propiedad *</label>
            <select {...register("property_type")} className={inputClass}>
              {Object.entries(PROPERTY_TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            {errors.property_type && <p className={errorClass}>{errors.property_type.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Operación *</label>
            <select {...register("operation_type")} className={inputClass}>
              {Object.entries(OPERATION_TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label === "Temp." ? "Alquiler temporal" : label}</option>
              ))}
            </select>
            {errors.operation_type && <p className={errorClass}>{errors.operation_type.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Estado *</label>
            <select {...register("status")} className={inputClass}>
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            {errors.status && <p className={errorClass}>{errors.status.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Precio *</label>
            <input
              {...register("price_amount")}
              type="number"
              min="0"
              step="any"
              className={inputClass}
              placeholder="150000"
            />
            {errors.price_amount && <p className={errorClass}>{errors.price_amount.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Moneda *</label>
            <select {...register("price_currency")} className={inputClass}>
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ubicación */}
      <div className="space-y-4">
        <SectionTitle>Ubicación</SectionTitle>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>País</label>
            <input {...register("country")} className={inputClass} placeholder="Argentina" />
          </div>
          <div>
            <label className={labelClass}>Provincia</label>
            <input {...register("province")} className={inputClass} placeholder="Buenos Aires" />
          </div>
          <div>
            <label className={labelClass}>Ciudad</label>
            <input {...register("city")} className={inputClass} placeholder="Buenos Aires" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Barrio</label>
            <input {...register("neighborhood")} className={inputClass} placeholder="Palermo" />
          </div>
          <div>
            <label className={labelClass}>Dirección</label>
            <input {...register("address")} className={inputClass} placeholder="Av. Santa Fe 1234" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Latitud</label>
              <input
                {...register("latitude")}
                type="number"
                step="any"
                className={inputClass}
                placeholder="-34.603"
              />
            </div>
            <div>
              <label className={labelClass}>Longitud</label>
              <input
                {...register("longitude")}
                type="number"
                step="any"
                className={inputClass}
                placeholder="-58.381"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleGeocode}
              disabled={isGeocoding}
              className="text-xs px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              {isGeocoding ? "Geocodificando…" : "Obtener coordenadas desde dirección"}
            </button>
            {geocodeStatus === "ok" && (
              <span className="text-xs text-green-600">Coordenadas actualizadas</span>
            )}
            {geocodeStatus === "error" && (
              <span className="text-xs text-red-600">No se encontró la dirección</span>
            )}
          </div>
        </div>
      </div>

      {/* Atributos */}
      <div className="space-y-4">
        <SectionTitle>Atributos</SectionTitle>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className={labelClass}>Dormitorios</label>
            <input {...register("bedrooms")} type="number" min="0" className={inputClass} />
            {errors.bedrooms && <p className={errorClass}>{errors.bedrooms.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Baños</label>
            <input {...register("bathrooms")} type="number" min="0" className={inputClass} />
            {errors.bathrooms && <p className={errorClass}>{errors.bathrooms.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Cocheras</label>
            <input {...register("parking_spaces")} type="number" min="0" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Año construcción</label>
            <input
              {...register("year_built")}
              type="number"
              min="1800"
              max="2100"
              className={inputClass}
            />
            {errors.year_built && <p className={errorClass}>{errors.year_built.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Superficie total (m²)</label>
            <input
              {...register("total_area_m2")}
              type="number"
              min="0"
              step="any"
              className={inputClass}
            />
            {errors.total_area_m2 && <p className={errorClass}>{errors.total_area_m2.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Superficie cubierta (m²)</label>
            <input
              {...register("covered_area_m2")}
              type="number"
              min="0"
              step="any"
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input {...register("has_pool")} type="checkbox" className="h-4 w-4 rounded border-slate-300" />
            Pileta
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input {...register("has_garden")} type="checkbox" className="h-4 w-4 rounded border-slate-300" />
            Jardín
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input {...register("has_balcony")} type="checkbox" className="h-4 w-4 rounded border-slate-300" />
            Balcón
          </label>
        </div>
      </div>

      {/* Imágenes */}
      <div className="space-y-4">
        <SectionTitle>Imágenes</SectionTitle>
        <ImageUploader
          propertyId={property?.id}
          initialImages={property?.property_images ?? []}
          onChange={setImageEntries}
        />
        {!property?.id && imageEntries.some((i) => !i.isExisting && i.file) && (
          <p className="text-xs text-slate-500">
            Las imágenes se subirán automáticamente al guardar la propiedad.
          </p>
        )}
      </div>

      {serverError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {isLoading ? "Guardando…" : property ? "Guardar cambios" : "Crear propiedad"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
