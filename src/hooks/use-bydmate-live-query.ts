"use client";

import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    void supabase.auth.getUser().then(({ data: userData }) => {
      const user = userData.user;
      if (!user) return;

      channel = supabase
        .channel(`bydmate-live:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bydmate_live_snapshots",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.bydmateLive });
          },
        )
        .subscribe();
    });

    return () => {
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [queryClient, supabase]);

  return useQuery({
    queryKey: queryKeys.bydmateLive,
    queryFn: fetchBydmateLive,
    staleTime: 15_000,
    refetchInterval: 60_000,
  });
}
