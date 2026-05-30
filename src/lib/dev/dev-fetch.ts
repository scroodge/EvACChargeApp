export function isDevAppRoute(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.pathname.startsWith("/dev/");
}

export function withDevApiParams(path: string): string {
  if (!isDevAppRoute()) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}dev=1`;
}

export async function devFetch(input: string, init?: RequestInit): Promise<Response> {
  return fetch(withDevApiParams(input), {
    ...init,
    cache: "no-store",
    headers: {
      ...init?.headers,
      ...(isDevAppRoute() ? { "x-voltflow-dev-auth-bypass": "1" } : {}),
    },
  });
}
