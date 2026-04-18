import { z } from "zod";

type RawNum = string | number | undefined;

function toOptNum(v: RawNum): number | undefined {
  if (v === "" || v === undefined) return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

function toOptPositiveNum(v: RawNum): number | undefined {
  const n = toOptNum(v);
  return n === undefined || n <= 0 ? undefined : n;
}

function toNonNegInt(v: RawNum, fallback = 0): number {
  const n = toOptNum(v);
  return n === undefined ? fallback : Math.round(Math.max(0, n));
}

const optPositiveNum = z
  .union([z.string(), z.number(), z.undefined()])
  .transform(toOptPositiveNum);

const optNum = z.union([z.string(), z.number(), z.undefined()]).transform(toOptNum);

const optNonNegInt = z
  .union([z.string(), z.number(), z.undefined()])
  .transform((v): number | undefined => {
    const n = toOptNum(v);
    return n === undefined ? undefined : Math.round(Math.max(0, n));
  });

const nonNegInt = z
  .union([z.string(), z.number(), z.undefined()])
  .transform((v): number => toNonNegInt(v));

export const propertyFormSchema = z.object({
  title: z.string().min(3, "Mínimo 3 caracteres"),
  description: z.string().optional(),
  property_type: z.enum(["apartment", "house", "ph", "land", "commercial", "office"]),
  operation_type: z.enum(["sale", "rent", "temporary_rent"]),
  status: z.enum(["draft", "available", "reserved", "sold", "rented", "cancelled"]),
  price_amount: z
    .union([z.string(), z.number()])
    .transform(toOptPositiveNum)
    .refine((v): v is number => v !== undefined && v > 0, {
      message: "El precio debe ser mayor a 0"
    }),
  price_currency: z.enum(["USD", "ARS", "EUR"]),
  country: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  neighborhood: z.string().optional(),
  address: z.string().optional(),
  latitude: optNum,
  longitude: optNum,
  bedrooms: nonNegInt,
  bathrooms: nonNegInt,
  total_area_m2: optPositiveNum,
  covered_area_m2: optPositiveNum,
  parking_spaces: optNonNegInt,
  year_built: z
    .union([z.string(), z.number(), z.undefined()])
    .transform(toOptNum)
    .refine((v) => v === undefined || (v >= 1800 && v <= 2100 && Number.isInteger(v)), {
      message: "Año inválido (1800–2100)"
    })
    .transform((v): number | undefined => v),
  has_pool: z.boolean(),
  has_garden: z.boolean(),
  has_balcony: z.boolean(),
});

export type PropertyFormValues = z.infer<typeof propertyFormSchema>;

export const propertyApiSchema = propertyFormSchema;
