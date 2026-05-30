"use client";

import { useCallback } from "react";
import { usePathname } from "next/navigation";

export function getDevPathPrefix(pathname?: string): string {
  const path =
    pathname ??
    (typeof window !== "undefined" ? window.location.pathname : "");
  if (path.startsWith("/dev/site")) return "/dev/site";
  if (path.startsWith("/dev/")) return "/dev";
  return "";
}

export function withDevPath(path: string, prefix?: string): string {
  const devPrefix = prefix ?? getDevPathPrefix();
  if (!devPrefix) return path;
  if (path.startsWith(devPrefix)) return path;
  return `${devPrefix}${path}`;
}

export function useAppPath() {
  const pathname = usePathname();
  const prefix = getDevPathPrefix(pathname);
  return useCallback((path: string) => withDevPath(path, prefix), [prefix]);
}
