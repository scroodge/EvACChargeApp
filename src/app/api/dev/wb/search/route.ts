import { NextRequest, NextResponse } from "next/server";

import { proxyBackendRequest } from "../_proxy";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.trim();

  if (!query) {
    return NextResponse.json(
      { error: "Query is required." },
      { status: 400 },
    );
  }

  const existingIds = await getExistingWbIds(query);
  const backendResponse = await proxyBackendRequest("/api/marketplace/search", {
    body: JSON.stringify({
      query,
      sources: ["wildberries"],
      limit: 20,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const payload = await backendResponse.json();

  if (!backendResponse.ok) {
    return NextResponse.json(payload, { status: backendResponse.status });
  }

  return NextResponse.json({
    items: Array.isArray(payload.items)
      ? payload.items.map(mapMarketplaceItem)
        .map((item: ReturnType<typeof mapMarketplaceItem>) => ({
          ...item,
          exists_in_db: existingIds.has(item.wb_id),
        }))
      : [],
  });
}

async function getExistingWbIds(query: string) {
  const params = new URLSearchParams({
    limit: "200",
    query,
    source: "wildberries",
  });
  const response = await proxyBackendRequest(
    `/api/marketplace/items?${params.toString()}`,
  );

  if (!response.ok) {
    return new Set<string>();
  }

  const payload = await response.json();
  const items = Array.isArray(payload.items) ? payload.items : [];

  return new Set(
    items
      .map((item: Record<string, unknown>) => stringValue(item.external_id))
      .filter(Boolean),
  );
}

function mapMarketplaceItem(item: Record<string, unknown>) {
  const wbId = stringValue(item.external_id);

  return {
    wb_id: wbId,
    name: stringValue(item.title),
    brand: stringValue(item.seller),
    price: numberValue(item.price) ?? 0,
    rating: numberValue(item.rating) ?? 0,
    image: stringValue(item.image_url),
    url: stringValue(item.url) || wildberriesUrl(wbId),
    exists_in_db: false,
  };
}

function wildberriesUrl(wbId: string) {
  return wbId ? `https://www.wildberries.ru/catalog/${wbId}/detail.aspx` : "";
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown) {
  return typeof value === "number" ? value : null;
}
