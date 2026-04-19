import { describe, it, expect } from "vitest";
import { formatPrice } from "@/features/properties/utils";

describe("formatPrice", () => {
  it("formats amounts with thousands separator and currency prefix", () => {
    expect(formatPrice(150000, "USD")).toBe("USD 150.000");
    expect(formatPrice(0, "ARS")).toBe("ARS 0");
  });
});
