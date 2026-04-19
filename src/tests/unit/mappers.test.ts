import { describe, it, expect } from "vitest";
import { mapRawToExternalPropertyDTO } from "@/lib/external-api/mappers";
import type { RawExternalProperty } from "@/lib/external-api/types";

const BASE_RAW: RawExternalProperty = {
  id: "ext-001",
  title: "Departamento en Palermo",
  description: "Muy luminoso",
  operation: "rent",
  type: "apartment",
  price: { value: 850, currency: "USD" },
  location: {
    country: "Argentina",
    province: "Buenos Aires",
    city: "Buenos Aires",
    neighborhood: "Palermo"
  },
  features: { beds: 2, baths: 1, total_area: 55, covered_area: 50, parking: 0 },
  images: [],
  published_at: "2026-03-01T10:00:00Z"
};

describe("mapRawToExternalPropertyDTO", () => {
  it("translates provider field names to domain field names", () => {
    const dto = mapRawToExternalPropertyDTO(BASE_RAW);
    expect(dto.attributes.bedrooms).toBe(2);
    expect(dto.attributes.bathrooms).toBe(1);
    expect(dto.attributes.totalAreaM2).toBe(55);
    expect(dto.attributes.parkingSpaces).toBe(0);
  });

  it("normalizes operation and property type aliases", () => {
    expect(mapRawToExternalPropertyDTO({ ...BASE_RAW, operation: "alquiler" }).operationType).toBe("rent");
    expect(mapRawToExternalPropertyDTO({ ...BASE_RAW, type: "flat" }).propertyType).toBe("apartment");
    expect(mapRawToExternalPropertyDTO({ ...BASE_RAW, type: "local" }).propertyType).toBe("commercial");
  });
});
