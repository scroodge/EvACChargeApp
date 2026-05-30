"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";

import { CarForm } from "@/components/cars/car-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useCarsQuery, useUpdateCarMutation } from "@/hooks/use-cars-query";
import { useTranslation } from "@/hooks/use-translation";
import { useAppPath } from "@/lib/dev/dev-path";

export function EditCarForm({ carId }: { carId: string }) {
  const router = useRouter();
  const appPath = useAppPath();
  const { data: carsResult, isLoading } = useCarsQuery();
  const cars = carsResult?.cars;
  const mutation = useUpdateCarMutation(carId);
  const { t } = useTranslation();
  const car = cars?.find((item) => item.id === carId);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    mutation.mutate(fd, {
      onSuccess: () => {
        router.replace(appPath("/settings"));
      },
    });
  };

  if (isLoading) {
    return <Skeleton className="h-[420px] w-full rounded-3xl" />;
  }

  if (!car) {
    return (
      <p className="text-muted-foreground text-base leading-relaxed">
        {t("cars.notFound")}
      </p>
    );
  }

  return (
    <CarForm
      mode="edit"
      car={car}
      cancelHref={appPath("/settings")}
      isPending={mutation.isPending}
      onSubmit={handleSubmit}
    />
  );
}
