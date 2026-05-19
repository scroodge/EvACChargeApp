import { NextRequest, NextResponse } from "next/server";

import { searchKnowledge } from "@/lib/knowledge-search";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const query = typeof body.query === "string" ? body.query.trim() : "";
    const category = typeof body.category === "string" ? body.category : null;
    const limit =
      typeof body.limit === "number" && body.limit > 0 && body.limit <= 20
        ? body.limit
        : 8;

    if (query.length < 2) {
      return NextResponse.json(
        { error: "Query must be at least 2 characters long." },
        { status: 400 },
      );
    }

    const results = await searchKnowledge({
      query,
      category,
      limit,
    });

    return NextResponse.json({
      query,
      results,
    });
  } catch (error) {
    console.error("Knowledge search API error:", error);

    return NextResponse.json(
      { error: "Knowledge search failed." },
      { status: 500 },
    );
  }
}
