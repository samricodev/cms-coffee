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

export function formatDate(value: unknown): string {
  const date =
    value instanceof Date
      ? value
      : typeof value === "string"
        ? new Date(`${value}T12:00:00`)
        : null;

  return date && !Number.isNaN(date.getTime()) ? longDate.format(date) : "";
}

export function formatShortDate(value: unknown): string {
  const date =
    value instanceof Date
      ? value
      : typeof value === "string"
        ? new Date(`${value}T12:00:00`)
        : null;

  return date && !Number.isNaN(date.getTime()) ? shortDate.format(date) : "";
}

export function asText(value: unknown): string {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}

export function asList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}
