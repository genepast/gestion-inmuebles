import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import { propertyApiSchema } from "@/features/properties/schemas/property.schema";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(12),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  type: z.string().optional(),
  operation: z.string().optional(),
  city: z.string().optional(),
  status: z.string().optional(),
  minBedrooms: z.coerce.number().int().nonnegative().optional(),
  minBathrooms: z.coerce.number().int().nonnegative().optional(),
  sort: z.enum(["created_at:desc", "price_amount:asc", "price_amount:desc", "total_area_m2:desc"]).optional(),
  q: z.string().optional()
});

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));

  if (!parsed.success) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const { page, pageSize, minPrice, maxPrice, type, operation, city, status, minBedrooms, minBathrooms, sort, q } = parsed.data;

  const supabase = createSupabaseServerClient();

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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (data ?? []).map((p) => {
    const images = (p.property_images ?? []) as { storage_path: string; is_primary: boolean | null; position: number }[];
    const primary = images.find((i) => i.is_primary) ?? images.sort((a, b) => a.position - b.position)[0];
    const primary_image_url = primary
      ? supabase.storage.from("property-images").getPublicUrl(primary.storage_path).data.publicUrl
      : null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { property_images, ...rest } = p;
    return { ...rest, primary_image_url };
  });

  return NextResponse.json({
    data: items,
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize)
  });
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = propertyApiSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { reason: _reason, ...insertData } = parsed.data;
  const { data, error } = await supabase
    .from("properties")
    .insert({ ...insertData, created_by: user.id, source: "manual" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
