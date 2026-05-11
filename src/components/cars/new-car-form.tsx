"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreateCarMutation } from "@/hooks/use-cars-query";
import { useTranslation } from "@/hooks/use-translation";
import { useAppPreferences } from "@/stores/use-app-preferences";

export function NewCarForm() {
  const router = useRouter();
  const mutation = useCreateCarMutation();
  const setCar = useAppPreferences((s) => s.setSelectedCarId);
  const { t } = useTranslation();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    mutation.mutate(fd, {
      onSuccess: (createdId) => {
        setCar(createdId);
        router.replace("/dashboard");
      },
    });
  };

  return (
    <Card className="border-white/[0.1] shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]">
      <CardHeader>
        <CardTitle className="text-2xl tracking-tight">{t("cars.title")}</CardTitle>
        <p className="text-muted-foreground text-base">
          {t("cars.description")}
        </p>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-5">
          <div className="space-y-2">
            <Label htmlFor="name">{t("cars.nickname")}</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder={t("cars.nicknamePlaceholder") as string}
              className="min-h-[52px] rounded-2xl text-lg"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="battery_capacity_kwh">{t("cars.battery")}</Label>
            <Input
              id="battery_capacity_kwh"
              name="battery_capacity_kwh"
              type="number"
              inputMode="decimal"
              min={10}
              max={300}
              step="0.1"
              required
              defaultValue="75"
              className="min-h-[52px] rounded-2xl text-lg"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="default_charger_power_kw">{t("cars.wallbox")}</Label>
              <Input
                id="default_charger_power_kw"
                name="default_charger_power_kw"
                type="number"
                inputMode="decimal"
                step="0.1"
                min={1}
                max={300}
                defaultValue="11"
                className="min-h-[52px] rounded-2xl text-lg"
              />
              <p className="text-muted-foreground text-xs">
                {t("cars.wallboxHelp")}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="default_efficiency_percent">{t("cars.efficiency")}</Label>
              <Input
                id="default_efficiency_percent"
                name="default_efficiency_percent"
                type="number"
                inputMode="numeric"
                min={70}
                max={100}
                step="1"
                defaultValue="92"
                className="min-h-[52px] rounded-2xl text-lg"
              />
              <p className="text-muted-foreground text-xs">
                {t("cars.efficiencyHelp")}
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-8 sm:flex-row">
          <Button
            variant="outline"
            className="min-h-[52px] w-full rounded-full border-white/20 sm:w-1/2"
            type="button"
            asChild
          >
            <Link href="/dashboard">{t("common.cancel")}</Link>
          </Button>
          <Button
            className="hover:brightness-110 min-h-[52px] w-full rounded-full text-base font-semibold sm:flex-1"
            type="submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? t("common.saving") : t("cars.save")}
          </Button>
          {mutation.isPending ? (
            <Skeleton className="h-[18px] w-full rounded-full" />
          ) : null}
        </CardFooter>
      </form>
    </Card>
  );
}
