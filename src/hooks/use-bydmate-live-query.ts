"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import type { BydmateLiveSnapshotRow } from "@/types/database";

async function fetchBydmateLive(): Promise<BydmateLiveSnapshotRow[]> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("bydmate_live_snapshots")
    .select("*")
    .eq("user_id", user.id)
    .order("received_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as BydmateLiveSnapshotRow[];
}

export function useBydmateLiveQuery() {
  return useQuery({
    queryKey: queryKeys.bydmateLive,
    queryFn: fetchBydmateLive,
    refetchInterval: 5000,
  });
}
