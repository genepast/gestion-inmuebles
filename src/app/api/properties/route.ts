import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import { propertyApiSchema } from "@/features/properties/schemas/property.schema";
import {
  findProperties,
  findUserRole,
  createProperty
} from "@/features/properties/repositories/property.repository";

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

  const supabase = createSupabaseServerClient();

  try {
    const { items, total } = await findProperties(parsed.data, supabase);
    const { page, pageSize } = parsed.data;

    return NextResponse.json({
      data: items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al cargar propiedades";
    return NextResponse.json({ error: message }, { status: 500 });
  }
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
  const { reason: _reason, assigned_agent_id: formAgentId, ...propertyData } = parsed.data;

  const profile = await findUserRole(user.id, supabase);
  const assigned_agent_id = profile?.role === "agent" ? user.id : (formAgentId ?? null);

  try {
    const data = await createProperty(
      { ...propertyData, created_by: user.id, source: "manual", assigned_agent_id },
      supabase
    );
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear propiedad";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
