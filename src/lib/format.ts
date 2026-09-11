const money = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

const longDate = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const shortDate = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
});

export function formatMoney(value: unknown): string {
  return typeof value === "number" ? money.format(value) : "";
}

function toDate(value: unknown): Date | null {
  const date =
    value instanceof Date
      ? value
      : typeof value === "string"
        ? new Date(`${value}T12:00:00`)
        : null;

  return date && !Number.isNaN(date.getTime()) ? date : null;
}

export function formatDate(value: unknown): string {
  const date = toDate(value);
  return date ? longDate.format(date) : "";
}

export function formatShortDate(value: unknown): string {
  const date = toDate(value);
  return date ? shortDate.format(date) : "";
}

export function dateParts(value: unknown): { day: string; month: string } | null {
  const date = toDate(value);
  if (!date) return null;

  const parts = shortDate.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";

  return { day: part("day"), month: part("month").replace(".", "") };
}

export function asText(value: unknown): string {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}

export function asList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}
