import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import {
  findPropertyStatus,
  updatePropertyStatus,
  insertStatusHistory
} from "../repositories/property.repository";
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

  const property = await findPropertyStatus(propertyId, supabase);
  const rawStatus = property.status;

  if (!isValidStatus(rawStatus)) {
    throw new Error(`Estado desconocido en DB: "${rawStatus}"`);
  }

  const fromStatus: PropertyStatus = rawStatus;
  const allowed = VALID_TRANSITIONS[fromStatus];

  if (!allowed.includes(toStatus)) {
    throw new StatusTransitionError(fromStatus, toStatus);
  }

  const updated = await updatePropertyStatus(propertyId, toStatus, supabase);

  if (!updated || updated.length === 0) {
    throw new Error("No autorizado para modificar esta propiedad");
  }

  await insertStatusHistory(
    { property_id: propertyId, from_status: fromStatus, to_status: toStatus, changed_by: userId, reason: reason ?? null },
    supabase
  );
}
