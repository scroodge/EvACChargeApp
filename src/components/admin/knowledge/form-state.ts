import type { AdminFormState } from "@/actions/knowledge-admin";

export function stateString(
  state: AdminFormState,
  name: string,
  fallback = "",
) {
  const value = state.values?.[name];
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

export function stateList(
  state: AdminFormState,
  name: string,
  fallback: string[] = [],
) {
  const value = state.values?.[name];
  if (Array.isArray(value)) return value;
  return value ? [value] : fallback;
}

export function stateKey(state: AdminFormState) {
  return state.values ? JSON.stringify(state.values) : "initial";
}
