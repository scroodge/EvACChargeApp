import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  await request.json().catch(() => null);

  return NextResponse.json(
    {
      error: "Save endpoint is not available in backend OpenAPI.",
      detail:
        "Backend exposes POST /api/marketplace/search and GET /api/marketplace/items, but no create/save product endpoint.",
    },
    { status: 501 },
  );
}
