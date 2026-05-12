export function normalizeDecimalInput(value: string) {
  return value.trim().replace(",", ".");
}

export function parseDecimalInput(value: string) {
  return Number(normalizeDecimalInput(value));
}

export function normalizeFormDecimal(value: FormDataEntryValue | null) {
  return typeof value === "string" ? normalizeDecimalInput(value) : value;
}
