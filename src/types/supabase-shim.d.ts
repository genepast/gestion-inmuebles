declare module "@supabase/supabase-js" {
  type SupabaseUser = {
    id: string;
  };

  type SupabaseAuthGetUserResult = {
    data: { user: SupabaseUser | null };
    error: unknown;
  };

  type SupabasePostgrestSingleResult<T> = {
    data: T | null;
    error: unknown;
  };

  interface SupabaseQueryBuilder<T> {
    select(columns?: string): SupabaseQueryBuilder<T>;
    eq(column: string, value: string): SupabaseQueryBuilder<T>;
    maybeSingle(): Promise<SupabasePostgrestSingleResult<T>>;
    insert(values: unknown): Promise<SupabasePostgrestSingleResult<unknown>>;
  }

  export interface SupabaseClient<Database = unknown> {
    readonly __database?: Database;
    auth: {
      getUser(): Promise<SupabaseAuthGetUserResult>;
    };
    from<T = unknown>(table: string): SupabaseQueryBuilder<T>;
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

