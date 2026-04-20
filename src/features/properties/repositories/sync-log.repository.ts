import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Supabase = SupabaseClient<Database>;

export async function createSyncLog(supabase: Supabase) {
  const { data, error } = await supabase
    .from("sync_logs")
    .insert({ status: "running" })
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export async function updateSyncLogSuccess(
  id: string,
  counts: { itemsCreated: number; itemsUpdated: number },
  supabase: Supabase
) {
  await supabase
    .from("sync_logs")
    .update({
      status: "success",
      finished_at: new Date().toISOString(),
      items_created: counts.itemsCreated,
      items_updated: counts.itemsUpdated,
    })
    .eq("id", id);
}

export async function updateSyncLogError(
  id: string,
  message: string,
  supabase: Supabase
) {
  await supabase
    .from("sync_logs")
    .update({
      status: "error",
      finished_at: new Date().toISOString(),
      error_message: message,
    })
    .eq("id", id);
}
