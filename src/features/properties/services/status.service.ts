import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { PropertyStatus } from "../types";

type ServerClient = SupabaseClient<Database>;

const VALID_TRANSITIONS: Record<PropertyStatus, readonly PropertyStatus[]> = {
  draft: ["available"],
  available: ["reserved"],
  reserved: ["sold", "rented", "cancelled"],
  sold: [],
  rented: [],
  cancelled: [],
};

const VALID_STATUSES = new Set<string>(Object.keys(VALID_TRANSITIONS));

function isValidStatus(value: string): value is PropertyStatus {
  return VALID_STATUSES.has(value);
}

export class StatusTransitionError extends Error {
  readonly fromStatus: PropertyStatus;
  readonly toStatus: PropertyStatus;

  constructor(from: PropertyStatus, to: PropertyStatus) {
    super(`Transición inválida: "${from}" → "${to}"`);
    this.name = "StatusTransitionError";
    this.fromStatus = from;
    this.toStatus = to;
  }
}

export async function transitionPropertyStatus(
  propertyId: string,
  toStatus: PropertyStatus,
  userId: string,
  reason?: string,
  client?: ServerClient
): Promise<void> {
  const supabase = client ?? createSupabaseServerClient();

  const { data: property, error: fetchError } = await supabase
    .from("properties")
    .select("status")
    .eq("id", propertyId)
    .single();

  if (fetchError || !property) {
    throw new Error("Propiedad no encontrada");
  }

  const rawStatus = property.status;

  if (!isValidStatus(rawStatus)) {
    throw new Error(`Estado desconocido en DB: "${rawStatus}"`);
  }

  const fromStatus: PropertyStatus = rawStatus;
  const allowed = VALID_TRANSITIONS[fromStatus];

  if (!allowed.includes(toStatus)) {
    throw new StatusTransitionError(fromStatus, toStatus);
  }

  const { data: updated, error: updateError } = await supabase
    .from("properties")
    .update({ status: toStatus, updated_at: new Date().toISOString() })
    .eq("id", propertyId)
    .select("id");

  if (updateError) throw updateError;
  if (!updated || updated.length === 0) {
    throw new Error("No autorizado para modificar esta propiedad");
  }

  const { error: historyError } = await supabase
    .from("property_status_history")
    .insert({
      property_id: propertyId,
      from_status: fromStatus,
      to_status: toStatus,
      changed_by: userId,
      reason: reason ?? null,
    });

  if (historyError) throw historyError;
}
