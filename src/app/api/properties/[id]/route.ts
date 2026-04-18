import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { propertyApiSchema } from "@/features/properties/schemas/property.schema";
import {
  transitionPropertyStatus,
  StatusTransitionError
} from "@/features/properties/services/status.service";
import type { PropertyStatus } from "@/features/properties/types";

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

  const { data, error } = await supabase
    .from("properties")
    .select(
      "*, property_images(id, storage_path, position, is_primary), property_status_history(id, from_status, to_status, changed_by, reason, changed_at)"
    )
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Propiedad no encontrada" }, { status: 404 });
  }

  return NextResponse.json(data);
}

const VALID_STATUSES = new Set<string>([
  "draft",
  "available",
  "reserved",
  "sold",
  "rented",
  "cancelled"
]);

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

  const { status: newStatus, reason, ...rest } = parsed.data;

  const { data: current, error: fetchError } = await supabase
    .from("properties")
    .select("status")
    .eq("id", params.id)
    .single();

  if (fetchError || !current) {
    return NextResponse.json({ error: "Propiedad no encontrada" }, { status: 404 });
  }

  if (newStatus && newStatus !== current.status) {
    if (!VALID_STATUSES.has(newStatus)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }
    try {
      await transitionPropertyStatus(params.id, newStatus as PropertyStatus, user.id, reason);
    } catch (err) {
      if (err instanceof StatusTransitionError) {
        return NextResponse.json({ error: err.message }, { status: 422 });
      }
      throw err;
    }
  }

  const { data, error } = await supabase
    .from("properties")
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { error } = await supabase.from("properties").delete().eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
