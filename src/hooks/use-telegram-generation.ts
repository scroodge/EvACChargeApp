"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useSyncExternalStore } from "react";

import { isCarGeneration, type CarGeneration } from "@/lib/car-generations";
import {
  readStoredTelegramGeneration,
  writeStoredTelegramGeneration,
} from "@/lib/telegram/generation";

const TELEGRAM_GENERATION_CHANGE_EVENT = "voltflow:telegram-generation-change";

export function useTelegramGeneration() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlGeneration = searchParams.get("gen");
  const storedGeneration = useSyncExternalStore(
    subscribeToTelegramGeneration,
    getStoredTelegramGenerationSnapshot,
    getServerTelegramGenerationSnapshot,
  );
  const generation = isCarGeneration(urlGeneration)
    ? urlGeneration
    : storedGeneration ?? "gen1_2024";

  const setTelegramGeneration = useCallback(
    (value: CarGeneration) => {
      writeStoredTelegramGeneration(value);
      window.dispatchEvent(new Event(TELEGRAM_GENERATION_CHANGE_EVENT));

      const params = new URLSearchParams(searchParams.toString());
      params.set("gen", value);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return [generation, setTelegramGeneration] as const;
}

function subscribeToTelegramGeneration(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(TELEGRAM_GENERATION_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(TELEGRAM_GENERATION_CHANGE_EVENT, onStoreChange);
  };
}

function getStoredTelegramGenerationSnapshot() {
  return readStoredTelegramGeneration();
}

function getServerTelegramGenerationSnapshot() {
  return null;
}
