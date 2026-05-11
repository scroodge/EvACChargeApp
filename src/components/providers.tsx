"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegistrar } from "@/components/sw-register";
import { useAppPreferences } from "@/stores/use-app-preferences";

export function Providers({ children }: { children: React.ReactNode }) {
  const locale = useAppPreferences((s) => s.locale);
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10_000,
            refetchOnWindowFocus: true,
          },
        },
      }),
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster richColors theme="dark" position="top-center" />
      <ServiceWorkerRegistrar />
    </QueryClientProvider>
  );
}
