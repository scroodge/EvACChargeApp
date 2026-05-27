import { NextResponse } from "next/server";

export async function proxyBackendRequest(
  path: string,
  init: RequestInit = {},
) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_API_URL is not configured." },
      { status: 500 },
    );
  }

  const url = new URL(path, baseUrl);

  try {
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...init.headers,
      },
    });
    const payload = await readResponsePayload(response);

    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Backend request failed.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}

async function readResponsePayload(response: Response) {
  const contentType = response.headers.get("Content-Type") ?? "";

  if (response.status === 204) {
    return null;
  }

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return { detail: text || response.statusText };
  }
}
