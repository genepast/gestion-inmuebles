import type { Tables } from "@/lib/supabase/database.types";

export type PropertySource = "manual" | "external";

export type OperationType = "sale" | "rent" | "temporary_rent";

export type PropertyStatus =
  | "draft"
  | "available"
  | "reserved"
  | "sold"
  | "rented"
  | "cancelled";

export type PriceCurrency = "USD" | "ARS" | "EUR";

export type PropertyType =
  | "apartment"
  | "house"
  | "ph"
  | "land"
  | "commercial"
  | "office";

// Derived from generated DB types — always in sync with the real schema.
export type PropertyRow = Tables<"properties">;
