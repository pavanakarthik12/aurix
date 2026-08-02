export function formatCurrency(
  value: number,
  currency: string = "INR",
  options?: Intl.NumberFormatOptions
) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    ...options,
  }).format(value);
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Indian-compact money formatting: ₹8.4 L / ₹1.2 Cr / ₹95,000.
 * Used for projection and "future value" callouts.
 */
export function formatLakh(value: number, fractionDigits = 1) {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(fractionDigits)} Cr`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(fractionDigits)} L`;
  return `${sign}₹${Math.round(abs).toLocaleString("en-IN")}`;
}

export function formatPercent(value: number, fractionDigits = 1) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(fractionDigits)}%`;
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  }).format(d);
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
