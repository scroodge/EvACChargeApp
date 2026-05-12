"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createCar } from "@/actions/cars";
import { createClient } from "@/lib/supabase/client";
import { mapCar } from "@/lib/db-map";
import { parseDecimalInput } from "@/lib/number-input";
import { queryKeys } from "@/lib/query-keys";
import { useTranslation } from "@/hooks/use-translation";
import type { Car } from "@/types/database";

async function fetchCars(): Promise<Car[]> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((r) => mapCar(r as Record<string, unknown>));
}

export function useCarsQuery() {
  return useQuery({
    queryKey: queryKeys.cars,
    queryFn: fetchCars,
  });
}

export function useCreateCarMutation() {
  const qc = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (vals: FormData) => {
      const result = await createCar(vals);
      if (!result.ok) {
        throw new Error(typeof result.error === "string" ? result.error : "Could not save");
      }
      return result.carId;
    },
    onMutate: async (formData) => {
      await qc.cancelQueries({ queryKey: queryKeys.cars });
      const previous = qc.getQueryData<Car[]>(queryKeys.cars);

      const optimistic: Car = {
        id: crypto.randomUUID(),
        user_id: "local",
        name: String(formData.get("name") ?? "Vehicle"),
        battery_capacity_kwh: parseDecimalInput(String(formData.get("battery_capacity_kwh") ?? "")) || 75,
        default_charger_power_kw: parseDecimalInput(String(formData.get("default_charger_power_kw") ?? "")) || 4.4,
        default_efficiency_percent: Number(formData.get("default_efficiency_percent")) || 90,
        created_at: new Date().toISOString(),
      };

      qc.setQueryData<Car[]>(queryKeys.cars, (old = []) => [optimistic, ...old]);

      return { previous, tempId: optimistic.id };
    },
    onError: (err: Error, _form, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.cars, ctx.previous);
      toast.error(err.message);
    },
    onSuccess: () => {
      toast.success(t("cars.saved") as string);
    },
    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.cars });
    },
  });
}
