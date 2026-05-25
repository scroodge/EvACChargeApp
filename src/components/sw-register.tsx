"use client";

import { useEffect } from "react";

import { ensurePushSubscription } from "@/lib/push/client";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }
    void navigator.serviceWorker
      .register("/sw.js")
      .then(() => ensurePushSubscription())
      .catch(() => {
        /* non-fatal */
      });
  }, []);

  return null;
}
