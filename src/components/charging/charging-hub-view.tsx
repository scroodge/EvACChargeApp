"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/hooks/use-translation";
import { queryKeys } from "@/lib/query-keys";
import { fetchSessions } from "@/hooks/use-sessions-query";
export function ChargingHubView() {
  const router = useRouter();
  const { t } = useTranslation();
  const {
    data: sessions,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: queryKeys.sessions,
    queryFn: fetchSessions,
    refetchInterval: 5000,
  });

  const active = useMemo(
    () => sessions?.find((s) => s.status === "charging"),
    [sessions],
  );

  useEffect(() => {
    if (active?.id) {
      router.replace(`/charging/${active.id}`);
      return;
    }

    if (!isLoading && sessions) {
      router.replace("/dashboard");
    }
  }, [active, isLoading, router, sessions]);

  if (!active && (isLoading || !sessions)) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <Skeleton className="h-10 w-3/5 self-center rounded-xl" />
        <Skeleton className="h-[320px] w-full rounded-[2rem]" />
        <Skeleton className="h-14 rounded-full" />
      </div>
    );
  }

  if (active) {
    return (
      <div className="text-muted-foreground flex flex-1 flex-col items-center gap-12 px-6 py-36 text-lg">
        <p>{t("charging.syncing")}</p>
        <Button asChild variant="outline" size="lg" className="h-[52px] rounded-full px-12">
          <Link href={`/charging/${active.id}`}>{t("charging.redirectStalls")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="text-muted-foreground flex flex-1 flex-col items-center gap-6 px-6 py-24 text-center">
      <p>{isFetching ? t("charging.refreshing") : t("charging.syncHint")}</p>
      <Button className="h-[52px] rounded-full px-8" variant="secondary" onClick={() => void refetch()}>
        {t("charging.checkAgain")}
      </Button>
      <Button asChild className="h-[52px] rounded-full px-8" size="lg">
        <Link href="/dashboard">{t("charging.backCockpit")}</Link>
      </Button>
    </div>
  );
}
