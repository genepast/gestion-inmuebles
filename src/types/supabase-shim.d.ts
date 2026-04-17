declare module "@supabase/supabase-js" {
  export interface SupabaseClient<Database = unknown> {
    readonly __database?: Database;
  }

  export function createClient<Database = unknown>(
    supabaseUrl: string,
    supabaseKey: string,
    options?: unknown
  ): SupabaseClient<Database>;
}

declare module "@supabase/ssr" {
  import type { SupabaseClient } from "@supabase/supabase-js";

  export function createBrowserClient<Database = unknown>(
    supabaseUrl: string,
    supabaseKey: string
  ): SupabaseClient<Database>;

  export function createServerClient<Database = unknown>(
    supabaseUrl: string,
    supabaseKey: string,
    options: unknown
  ): SupabaseClient<Database>;
}

