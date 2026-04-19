import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockSingle = vi.fn();
const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => ({
    auth: { getUser: mockGetUser },
    from: () => ({
      insert: () => ({ select: () => ({ single: mockSingle }) })
    })
  })
}));

const VALID_BODY = {
  title: "Departamento en Palermo",
  property_type: "apartment",
  operation_type: "rent",
  status: "available",
  price_amount: 850,
  price_currency: "USD",
  bedrooms: 2,
  bathrooms: 1,
  has_pool: false,
  has_garden: false,
  has_balcony: false
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/properties", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

describe("POST /api/properties", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const { POST } = await import("@/app/api/properties/route");
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(401);
  });

  it("returns 400 when body fails schema validation", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const { POST } = await import("@/app/api/properties/route");
    const res = await POST(makeRequest({ ...VALID_BODY, title: "Ab", price_amount: 0 }));
    expect(res.status).toBe(400);
  });

  it("returns 201 with created property on success", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockSingle.mockResolvedValue({
      data: { id: "prop-1", ...VALID_BODY, source: "manual", created_by: "user-1" },
      error: null
    });
    const { POST } = await import("@/app/api/properties/route");
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(201);
    const json = await res.json() as { source: string };
    expect(json.source).toBe("manual");
  });

  it("returns 500 when Supabase insert fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockSingle.mockResolvedValue({ data: null, error: { message: "db error" } });
    const { POST } = await import("@/app/api/properties/route");
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(500);
  });
});
