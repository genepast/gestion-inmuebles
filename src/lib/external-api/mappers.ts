import type { ExternalPropertyDTO, RawExternalProperty } from "./types";

// ---------------------------------------------------------------------------
// Field-name normalization maps
// These tables are the single source of truth for provider → domain mapping.
// ---------------------------------------------------------------------------

const OPERATION_TYPE_MAP: Record<string, ExternalPropertyDTO["operationType"]> = {
  sale: "sale",
  rent: "rent",
  temporary_rent: "temporary_rent",
  for_rent: "rent",
  alquiler: "rent",
  venta: "sale",
};

const PROPERTY_TYPE_MAP: Record<string, ExternalPropertyDTO["propertyType"]> = {
  apartment: "apartment",
  flat: "apartment",
  departamento: "apartment",
  house: "house",
  casa: "house",
  ph: "ph",
  land: "land",
  terreno: "land",
  commercial: "commercial",
  local: "commercial",
  office: "office",
  oficina: "office",
};

const CURRENCY_MAP: Record<string, ExternalPropertyDTO["price"]["currency"]> = {
  USD: "USD",
  ARS: "ARS",
  EUR: "EUR",
};

function mapOperationType(raw: string): ExternalPropertyDTO["operationType"] {
  return OPERATION_TYPE_MAP[raw.toLowerCase()] ?? "rent";
}

function mapPropertyType(raw: string): ExternalPropertyDTO["propertyType"] {
  return PROPERTY_TYPE_MAP[raw.toLowerCase()] ?? "apartment";
}

function mapCurrency(raw: string): ExternalPropertyDTO["price"]["currency"] {
  return CURRENCY_MAP[raw.toUpperCase()] ?? "USD";
}

// ---------------------------------------------------------------------------
// Main mapper: RawExternalProperty → ExternalPropertyDTO
//
// Key translations (provider field → domain field):
//   beds          → attributes.bedrooms
//   baths         → attributes.bathrooms
//   total_area    → attributes.totalAreaM2
//   covered_area  → attributes.coveredAreaM2
//   parking       → attributes.parkingSpaces
//   year          → attributes.yearBuilt
//   pool/garden/balcony → hasPool/hasGarden/hasBalcony
//   lat/lng       → latitude/longitude
//   price.value   → price.amount
//   operation     → operationType
//   type          → propertyType
// ---------------------------------------------------------------------------

export function mapRawToExternalPropertyDTO(
  raw: RawExternalProperty
): ExternalPropertyDTO {
  return {
    externalId: String(raw.id),
    title: raw.title,
    description: raw.description ?? "",
    operationType: mapOperationType(raw.operation),
    propertyType: mapPropertyType(raw.type),
    price: {
      amount: raw.price.value,
      currency: mapCurrency(raw.price.currency),
    },
    location: {
      country: raw.location.country,
      province: raw.location.province,
      city: raw.location.city,
      neighborhood: raw.location.neighborhood,
      address: raw.location.address,
      latitude: raw.location.lat,
      longitude: raw.location.lng,
    },
    attributes: {
      bedrooms: raw.features.beds,
      bathrooms: raw.features.baths,
      totalAreaM2: raw.features.total_area,
      coveredAreaM2: raw.features.covered_area ?? raw.features.total_area,
      parkingSpaces: raw.features.parking ?? 0,
      yearBuilt: raw.features.year,
      hasPool: raw.features.pool ?? false,
      hasGarden: raw.features.garden ?? false,
      hasBalcony: raw.features.balcony ?? false,
    },
    images: raw.images ?? [],
    publishedAt: raw.published_at ?? new Date().toISOString(),
  };
}
