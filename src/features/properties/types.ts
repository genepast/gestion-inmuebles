export type PropertySource = "manual" | "external";

export type OperationType = "sale" | "rent" | "temporary_rent";

export type PropertyStatus = "draft" | "available" | "reserved" | "sold" | "rented" | "cancelled";

export type PriceCurrency = "USD" | "ARS" | "EUR";

export interface PropertyRow {
  id: string;
  external_id: string | null;
  source: PropertySource;
  title: string;
  description: string | null;
  operation_type: OperationType;
  property_type: string;
  status: PropertyStatus;
  price_amount: number;
  price_currency: PriceCurrency;
  bedrooms: number;
  bathrooms: number;
  total_area_m2: number | null;
  covered_area_m2: number | null;
  parking_spaces: number | null;
  year_built: number | null;
  country: string | null;
  province: string | null;
  city: string | null;
  neighborhood: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  has_pool: boolean;
  has_garden: boolean;
  has_balcony: boolean;
  assigned_agent_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

