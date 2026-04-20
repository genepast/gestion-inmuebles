import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TablesInsert, TablesUpdate } from "@/lib/supabase/database.types";
import type { PropertyListItem, PropertyStatus } from "../types";

type Supabase = SupabaseClient<Database>;

export interface FindPropertiesFilters {
  page: number;
  pageSize: number;
  minPrice?: number;
  maxPrice?: number;
  type?: string;
  operation?: string;
  city?: string;
  status?: string;
  minBedrooms?: number;
  minBathrooms?: number;
  sort?: string;
  q?: string;
}

export async function findProperties(
  filters: FindPropertiesFilters,
  supabase: Supabase
): Promise<{ items: PropertyListItem[]; total: number }> {
  const { page, pageSize, minPrice, maxPrice, type, operation, city, status, minBedrooms, minBathrooms, sort, q } = filters;

  let query = supabase
    .from("properties")
    .select(
      "id, title, property_type, operation_type, status, price_amount, price_currency, city, province, country, bedrooms, bathrooms, total_area_m2, source, created_at, property_images(storage_path, is_primary, position)",
      { count: "exact" }
    );

  if (minPrice !== undefined) query = query.gte("price_amount", minPrice);
  if (maxPrice !== undefined) query = query.lte("price_amount", maxPrice);
  if (type) query = query.eq("property_type", type);
  if (operation) query = query.eq("operation_type", operation);
  if (city) query = query.ilike("city", `%${city}%`);
  if (status) query = query.eq("status", status);
  if (minBedrooms !== undefined) query = query.gte("bedrooms", minBedrooms);
  if (minBathrooms !== undefined) query = query.gte("bathrooms", minBathrooms);
  if (q) query = query.textSearch("fts", q, { type: "websearch" });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const [sortCol, sortDir] = (sort ?? "created_at:desc").split(":") as [string, string];

  const { data, error, count } = await query
    .order(sortCol, { ascending: sortDir === "asc", nullsFirst: false })
    .range(from, to);

  if (error) throw error;

  const items = (data ?? []).map((p) => {
    const images = (p.property_images ?? []) as { storage_path: string; is_primary: boolean | null; position: number }[];
    const primary = images.find((i) => i.is_primary) ?? images.sort((a, b) => a.position - b.position)[0];
    const primary_image_url = primary
      ? supabase.storage.from("property-images").getPublicUrl(primary.storage_path).data.publicUrl
      : null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { property_images: _imgs, ...rest } = p;
    return { ...rest, primary_image_url };
  });

  return { items, total: count ?? 0 };
}

export async function findPropertyById(id: string, supabase: Supabase) {
  const { data, error } = await supabase
    .from("properties")
    .select("*, property_images(id, storage_path, position, is_primary), property_status_history(id, from_status, to_status, changed_by, reason, changed_at)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function findPropertyStatus(id: string, supabase: Supabase) {
  const { data, error } = await supabase
    .from("properties")
    .select("status")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function findUserRole(userId: string, supabase: Supabase) {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

export async function createProperty(
  payload: TablesInsert<"properties">,
  supabase: Supabase
) {
  const { data, error } = await supabase
    .from("properties")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProperty(
  id: string,
  payload: TablesUpdate<"properties">,
  supabase: Supabase
) {
  const { error } = await supabase
    .from("properties")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
}

export async function refetchProperty(id: string, supabase: Supabase) {
  const { data, error } = await supabase
    .from("properties")
    .select()
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function updatePropertyStatus(
  id: string,
  status: PropertyStatus,
  supabase: Supabase
) {
  const { data, error } = await supabase
    .from("properties")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id");

  if (error) throw error;
  return data;
}

export async function deleteProperty(id: string, supabase: Supabase) {
  const { error } = await supabase.from("properties").delete().eq("id", id);
  if (error) throw error;
}

export async function upsertExternalProperties(
  rows: TablesInsert<"properties">[],
  supabase: Supabase
) {
  const { error } = await supabase
    .from("properties")
    .upsert(rows, { onConflict: "external_id" });

  if (error) throw error;
}

export async function findExistingExternalIds(
  externalIds: string[],
  supabase: Supabase
): Promise<string[]> {
  const { data } = await supabase
    .from("properties")
    .select("external_id")
    .in("external_id", externalIds);

  return (data ?? [])
    .map((r) => r.external_id)
    .filter((id): id is string => id !== null);
}

export async function insertStatusHistory(
  payload: {
    property_id: string;
    from_status: PropertyStatus;
    to_status: PropertyStatus;
    changed_by: string;
    reason: string | null;
  },
  supabase: Supabase
) {
  const { error } = await supabase.from("property_status_history").insert(payload);
  if (error) throw error;
}
