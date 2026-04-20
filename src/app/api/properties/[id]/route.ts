import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { propertyApiSchema } from "@/features/properties/schemas/property.schema";
import {
  transitionPropertyStatus,
  StatusTransitionError
} from "@/features/properties/services/status.service";
import {
  findPropertyById,
  findPropertyStatus,
  findUserRole,
  updateProperty,
  refetchProperty,
  deleteProperty
} from "@/features/properties/repositories/property.repository";
import type { PropertyStatus } from "@/features/properties/types";

const statusPatchSchema = z.object({
  status: z.enum(["draft", "available", "reserved", "sold", "rented", "cancelled"]),
  reason: z.string().optional()
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const data = await findPropertyById(params.id, supabase);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Propiedad no encontrada" }, { status: 404 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

  const { status: newStatus, reason, assigned_agent_id, ...rest } = parsed.data;

  try {
    const current = await findPropertyStatus(params.id, supabase);

    if (newStatus && newStatus !== current.status) {
      await transitionPropertyStatus(params.id, newStatus as PropertyStatus, user.id, reason);
    }

    const profile = await findUserRole(user.id, supabase);
    await updateProperty(
      params.id,
      {
        ...rest,
        updated_at: new Date().toISOString(),
        ...(profile?.role === "admin" ? { assigned_agent_id: assigned_agent_id ?? null } : {})
      },
      supabase
    );

    const data = await refetchProperty(params.id, supabase);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof StatusTransitionError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    const message = err instanceof Error ? err.message : "Error al actualizar propiedad";
    const status = message === "Propiedad no encontrada" ? 404 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

  const parsed = statusPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { status: newStatus, reason } = parsed.data;

  try {
    await transitionPropertyStatus(params.id, newStatus as PropertyStatus, user.id, reason);
    const data = await refetchProperty(params.id, supabase);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof StatusTransitionError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    const message = err instanceof Error ? err.message : "Error al cambiar estado";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    await deleteProperty(params.id, supabase);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al eliminar propiedad";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
