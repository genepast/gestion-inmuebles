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

