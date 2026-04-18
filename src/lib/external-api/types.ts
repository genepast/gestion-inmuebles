import { z } from "zod";

// ---------------------------------------------------------------------------
// Raw API schema — validated at the system boundary (untrusted external data)
// Field names match the provider's format (Anexo A del PDF).
// ---------------------------------------------------------------------------

export const RawExternalPropertySchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  description: z.string().optional(),
  operation: z.string(),
  type: z.string(),
  price: z.object({
    value: z.number(),
    currency: z.string(),
  }),
  location: z.object({
    country: z.string(),
    province: z.string(),
    city: z.string(),
    neighborhood: z.string().optional(),
    address: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }),
  features: z.object({
    beds: z.number(),
    baths: z.number(),
    total_area: z.number(),
    covered_area: z.number().optional(),
    parking: z.number().optional(),
    year: z.number().optional(),
    pool: z.boolean().optional(),
    garden: z.boolean().optional(),
    balcony: z.boolean().optional(),
  }),
  images: z.array(z.string()).optional(),
  published_at: z.string().optional(),
});

export type RawExternalProperty = z.infer<typeof RawExternalPropertySchema>;

// The API may return an array directly or wrapped in { data: [...] }
export const RawApiResponseSchema = z.union([
  z.array(RawExternalPropertySchema),
  z.object({
    data: z.array(RawExternalPropertySchema),
    meta: z
      .object({ total: z.number(), page: z.number(), per_page: z.number() })
      .optional(),
  }),
]);

// ---------------------------------------------------------------------------
// Internal DTO — the normalized shape every feature of the app uses.
// DB and UI must never depend on the provider's field names.
// ---------------------------------------------------------------------------

export interface ExternalPropertyDTO {
  externalId: string;
  title: string;
  description: string;
  operationType: "sale" | "rent" | "temporary_rent";
  propertyType: "apartment" | "house" | "ph" | "land" | "commercial" | "office";
  price: { amount: number; currency: "USD" | "ARS" | "EUR" };
  location: {
    country: string;
    province: string;
    city: string;
    neighborhood?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  attributes: {
    bedrooms: number;
    bathrooms: number;
    totalAreaM2: number;
    coveredAreaM2: number;
    parkingSpaces: number;
    yearBuilt?: number;
    hasPool: boolean;
    hasGarden: boolean;
    hasBalcony: boolean;
  };
  images: string[];
  publishedAt: string;
}
