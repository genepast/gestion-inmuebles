import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    { error: "Not implemented", endpoint: "/api/properties/export" },
    { status: 501 }
  );
}

