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

export interface PropertyListItem {
  id: string;
  title: string;
  property_type: string;
  operation_type: string;
  status: string;
  price_amount: number;
  price_currency: string;
  city: string | null;
  province: string | null;
  country: string | null;
  bedrooms: number;
  bathrooms: number;
  total_area_m2: number | null;
  source: string;
  created_at: string | null;
  primary_image_url: string | null;
}

export type SortOption = "created_at:desc" | "price_amount:asc" | "price_amount:desc" | "total_area_m2:desc";

export interface PropertyFilters {
  page?: number;
  pageSize?: number;
  minPrice?: number;
  maxPrice?: number;
  type?: string;
  operation?: string;
  city?: string;
  status?: string;
  minBedrooms?: number;
  minBathrooms?: number;
  sort?: SortOption;
  q?: string;
}

export interface PropertiesPageResponse {
  data: PropertyListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
