import { describe, it, expect } from "vitest";
import { StatusTransitionError } from "@/features/properties/services/status.service";

describe("StatusTransitionError", () => {
  it("exposes typed from/to statuses and a descriptive message", () => {
    const err = new StatusTransitionError("sold", "available");
    expect(err.fromStatus).toBe("sold");
    expect(err.toStatus).toBe("available");
    expect(err.message).toContain("sold");
    expect(err).toBeInstanceOf(Error);
  });
});
