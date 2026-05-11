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
    }
  }, [active, router]);

  if (!isLoading && !active && sessions) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6 text-center">
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs uppercase tracking-[0.3em]">
            {t("charging.hubEyebrow")}
          </p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight">
            {t("charging.idle")}
          </h1>
          <p className="text-muted-foreground mx-auto max-w-md text-lg">
            {t("charging.idleBody")}
          </p>
        </div>
        <div className="mx-auto mt-16 flex max-w-xl flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/[0.02] px-6 py-8">
          <p className="text-muted-foreground text-base">
            {isFetching ? t("charging.refreshing") : t("charging.syncHint")}
          </p>
          <Button
            className="mx-auto mt-8 h-[52px] min-w-[200px] rounded-full text-base font-semibold"
            onClick={() => void refetch()}
            variant="secondary"
          >
            {t("charging.checkAgain")}
          </Button>
          <Button asChild className="h-[52px] rounded-full text-base font-semibold" size="lg">
            <Link href="/dashboard">{t("charging.backCockpit")}</Link>
          </Button>
        </div>
      </div>
    );
  }

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

  return null;
}
