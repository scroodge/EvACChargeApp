import { NextResponse } from "next/server";

import { fetchTripSamples } from "@/lib/bydmate/telemetry-history";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ tripId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { tripId } = await context.params;
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const points = await fetchTripSamples({
      supabase,
      userId: userData.user.id,
      tripId,
    });

    return NextResponse.json({ tripId, points });
  } catch {
    return NextResponse.json({ error: "Failed to load trip samples" }, { status: 500 });
  }
}
