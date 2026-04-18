import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(12),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  type: z.string().optional(),
  city: z.string().optional(),
  status: z.string().optional(),
  q: z.string().optional()
});

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));

  if (!parsed.success) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const { page, pageSize, minPrice, maxPrice, type, city, status, q } = parsed.data;

  const supabase = createSupabaseServerClient();

  let query = supabase
    .from("properties")
    .select(
      "id, title, property_type, operation_type, status, price_amount, price_currency, city, province, country, bedrooms, bathrooms, total_area_m2, source, created_at",
      { count: "exact" }
    );

  if (minPrice !== undefined) query = query.gte("price_amount", minPrice);
  if (maxPrice !== undefined) query = query.lte("price_amount", maxPrice);
  if (type) query = query.eq("property_type", type);
  if (city) query = query.ilike("city", `%${city}%`);
  if (status) query = query.eq("status", status);
  if (q) query = query.textSearch("fts", q, { type: "websearch" });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize)
  });
}
