import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchExternalProperties } from "@/lib/external-api/client";
import { mapRawToExternalPropertyDTO } from "@/lib/external-api/mappers";
import type { ExternalPropertyDTO } from "@/lib/external-api/types";
import type { TablesInsert } from "@/lib/supabase/database.types";
import { findUserRole, findExistingExternalIds, upsertExternalProperties } from "@/features/properties/repositories/property.repository";
import { createSyncLog, updateSyncLogSuccess, updateSyncLogError } from "@/features/properties/repositories/sync-log.repository";

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
  const serverClient = createSupabaseServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await findUserRole(user.id, serverClient);
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();
  const syncLog = await createSyncLog(admin);
  const logId = syncLog.id;

  try {
    const raw = await fetchExternalProperties();
    const dtos = raw.map(mapRawToExternalPropertyDTO);

    if (dtos.length === 0) {
      await updateSyncLogSuccess(logId, { itemsCreated: 0, itemsUpdated: 0 }, admin);
      return NextResponse.json({ status: "success", items_created: 0, items_updated: 0 });
    }

    const externalIds = dtos.map((d) => d.externalId);
    const existingIds = await findExistingExternalIds(externalIds, admin);
    const existingIdSet = new Set(existingIds);

    const itemsCreated = dtos.filter((d) => !existingIdSet.has(d.externalId)).length;
    const itemsUpdated = dtos.filter((d) => existingIdSet.has(d.externalId)).length;

    await upsertExternalProperties(dtos.map(dtoToDbRow), admin);
    await updateSyncLogSuccess(logId, { itemsCreated, itemsUpdated }, admin);

    return NextResponse.json({ status: "success", items_created: itemsCreated, items_updated: itemsUpdated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await updateSyncLogError(logId, message, admin);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
