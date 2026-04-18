import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchExternalProperties } from "@/lib/external-api/client";
import { mapRawToExternalPropertyDTO } from "@/lib/external-api/mappers";
import type { ExternalPropertyDTO } from "@/lib/external-api/types";
import type { TablesInsert } from "@/lib/supabase/database.types";

function dtoToDbRow(dto: ExternalPropertyDTO): TablesInsert<"properties"> {
  return {
    external_id: dto.externalId,
    source: "external",
    status: "available",
    title: dto.title,
    description: dto.description,
    operation_type: dto.operationType,
    property_type: dto.propertyType,
    price_amount: dto.price.amount,
    price_currency: dto.price.currency,
    country: dto.location.country,
    province: dto.location.province,
    city: dto.location.city,
    neighborhood: dto.location.neighborhood ?? null,
    address: dto.location.address ?? null,
    latitude: dto.location.latitude ?? null,
    longitude: dto.location.longitude ?? null,
    bedrooms: dto.attributes.bedrooms,
    bathrooms: dto.attributes.bathrooms,
    total_area_m2: dto.attributes.totalAreaM2,
    covered_area_m2: dto.attributes.coveredAreaM2,
    parking_spaces: dto.attributes.parkingSpaces,
    year_built: dto.attributes.yearBuilt ?? null,
    has_pool: dto.attributes.hasPool,
    has_garden: dto.attributes.hasGarden,
    has_balcony: dto.attributes.hasBalcony,
  };
}

export async function POST() {
  // Auth guard: solo admins pueden disparar una sincronización
  const serverClient = createSupabaseServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await serverClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();

  // Registrar inicio del sync
  const { data: syncLog, error: logError } = await admin
    .from("sync_logs")
    .insert({ status: "running" })
    .select("id")
    .single();

  if (logError || !syncLog) {
    return NextResponse.json({ error: "Failed to initialize sync log" }, { status: 500 });
  }

  const logId = syncLog.id;

  try {
    // Fetch desde la API externa — el cliente ya aplica backoff exponencial internamente
    const raw = await fetchExternalProperties();
    const dtos = raw.map(mapRawToExternalPropertyDTO);

    if (dtos.length === 0) {
      await admin
        .from("sync_logs")
        .update({ status: "success", finished_at: new Date().toISOString(), items_created: 0, items_updated: 0 })
        .eq("id", logId);

      return NextResponse.json({ status: "success", items_created: 0, items_updated: 0 });
    }

    // Pre-flight: clasificar creates vs updates para el conteo en sync_logs
    const externalIds = dtos.map((d) => d.externalId);
    const { data: existing } = await admin
      .from("properties")
      .select("external_id")
      .in("external_id", externalIds);

    const existingIdSet = new Set(
      (existing ?? [])
        .map((r) => r.external_id)
        .filter((id): id is string => id !== null)
    );

    const itemsCreated = dtos.filter((d) => !existingIdSet.has(d.externalId)).length;
    const itemsUpdated = dtos.filter((d) => existingIdSet.has(d.externalId)).length;

    // Upsert idempotente — onConflict en external_id garantiza que si ya existe, actualiza
    const { error: upsertError } = await admin
      .from("properties")
      .upsert(dtos.map(dtoToDbRow), { onConflict: "external_id" });

    if (upsertError) throw new Error(upsertError.message);

    await admin
      .from("sync_logs")
      .update({
        status: "success",
        finished_at: new Date().toISOString(),
        items_created: itemsCreated,
        items_updated: itemsUpdated,
      })
      .eq("id", logId);

    return NextResponse.json({ status: "success", items_created: itemsCreated, items_updated: itemsUpdated });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    await admin
      .from("sync_logs")
      .update({
        status: "error",
        finished_at: new Date().toISOString(),
        error_message: message,
      })
      .eq("id", logId);

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
