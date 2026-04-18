import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const querySchema = z.object({
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  type: z.string().optional(),
  city: z.string().optional(),
  status: z.string().optional(),
  q: z.string().optional()
});

const CSV_HEADERS = [
  "ID",
  "Título",
  "Tipo",
  "Operación",
  "Estado",
  "Precio",
  "Moneda",
  "Ciudad",
  "Provincia",
  "País",
  "Ambientes",
  "Baños",
  "Sup. total m²",
  "Fuente",
  "Creado"
];

function escapeCsvField(value: string | number | null | undefined): string {
  const str = value == null ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));

  if (!parsed.success) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const { minPrice, maxPrice, type, city, status, q } = parsed.data;

  let query = supabase
    .from("properties")
    .select(
      "id, title, property_type, operation_type, status, price_amount, price_currency, city, province, country, bedrooms, bathrooms, total_area_m2, source, created_at"
    )
    .order("created_at", { ascending: false });

  if (minPrice !== undefined) query = query.gte("price_amount", minPrice);
  if (maxPrice !== undefined) query = query.lte("price_amount", maxPrice);
  if (type) query = query.eq("property_type", type);
  if (city) query = query.ilike("city", `%${city}%`);
  if (status) query = query.eq("status", status);
  if (q) query = query.textSearch("fts", q, { type: "websearch" });

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []).map((p) =>
    [
      p.id,
      p.title,
      p.property_type,
      p.operation_type,
      p.status,
      p.price_amount,
      p.price_currency,
      p.city,
      p.province,
      p.country,
      p.bedrooms,
      p.bathrooms,
      p.total_area_m2,
      p.source,
      p.created_at
    ]
      .map(escapeCsvField)
      .join(",")
  );

  const csv = [CSV_HEADERS.join(","), ...rows].join("\n");

  const filename = `propiedades_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
