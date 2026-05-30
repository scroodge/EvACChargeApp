"use client";

import { useSyncExternalStore } from "react";

function subscribe(onStoreChange: () => void) {
  document.addEventListener("visibilitychange", onStoreChange);
  return () => document.removeEventListener("visibilitychange", onStoreChange);
}

function getSnapshot() {
  return document.visibilityState === "visible";
}

function getServerSnapshot() {
  return true;
}

/** True when the tab/PWA window is visible — use to pause background polling. */
export function usePageVisible() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
