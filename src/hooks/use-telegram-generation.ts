"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { isCarGeneration, type CarGeneration } from "@/lib/car-generations";
import {
  readStoredTelegramGeneration,
  writeStoredTelegramGeneration,
} from "@/lib/telegram/generation";

export function useTelegramGeneration() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlGeneration = searchParams.get("gen");
  const [generation, setGeneration] = useState<CarGeneration>(() => {
    if (isCarGeneration(urlGeneration)) return urlGeneration;
    return "gen1_2024";
  });

  useEffect(() => {
    const stored = readStoredTelegramGeneration();
    if (stored) {
      setGeneration(stored);
      return;
    }
    if (isCarGeneration(urlGeneration)) {
      setGeneration(urlGeneration);
    }
  }, [urlGeneration]);

  const setTelegramGeneration = useCallback(
    (value: CarGeneration) => {
      setGeneration(value);
      writeStoredTelegramGeneration(value);

      const params = new URLSearchParams(searchParams.toString());
      params.set("gen", value);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return [generation, setTelegramGeneration] as const;
}
