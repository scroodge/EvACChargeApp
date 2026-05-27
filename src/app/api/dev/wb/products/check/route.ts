import { NextRequest, NextResponse } from "next/server";

import { proxyBackendRequest } from "../../_proxy";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const wbId = request.nextUrl.searchParams.get("wb_id")?.trim();

  if (!wbId) {
    return NextResponse.json(
      { error: "wb_id is required." },
      { status: 400 },
    );
  }

  const params = new URLSearchParams({
    limit: "20",
    query: wbId,
    source: "wildberries",
  });
  const backendResponse = await proxyBackendRequest(
    `/api/marketplace/items?${params.toString()}`,
  );
  const payload = await backendResponse.json();

  if (!backendResponse.ok) {
    return NextResponse.json(payload, { status: backendResponse.status });
  }

  const items = Array.isArray(payload.items) ? payload.items : [];
  const product = items.find(
    (item: Record<string, unknown>) => item.external_id === wbId,
  );

  return NextResponse.json({
    exists: Boolean(product),
    product: product
      ? {
          id: `${stringValue(product.source)}:${stringValue(product.external_id)}`,
          wb_id: stringValue(product.external_id),
          name: stringValue(product.title),
        }
      : null,
  });
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}
