const DATE_SLASH_PATTERN = /\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/;
const DATE_ISO_PATTERN = /\b(\d{4})-(\d{2})-(\d{2})\b/;
const DATE_MONTH_NAME_PATTERN =
  /\b(\d{1,2})[\s-]+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s-]+(\d{2,4})\b/i;

const MONTHS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function toIsoDate(year: number, month: number, day: number): string | null {
  const fullYear = year < 100 ? 2000 + year : year;
  const date = new Date(Date.UTC(fullYear, month - 1, day));
  if (
    date.getUTCFullYear() !== fullYear ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return `${fullYear}-${pad2(month)}-${pad2(day)}`;
}

/**
 * Parses a date out of arbitrary text, preferring day-first formats
 * (DD/MM/YYYY, DD-Mon-YYYY) since these are the Indian conventions used by
 * UPI receipts and bank statements this app targets. Returns an ISO
 * (YYYY-MM-DD) string, or null if no valid date is found.
 */
export function parseFlexibleDate(text: string): string | null {
  const isoMatch = text.match(DATE_ISO_PATTERN);
  if (isoMatch) {
    const iso = toIsoDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
    if (iso) return iso;
  }

  const monthNameMatch = text.match(DATE_MONTH_NAME_PATTERN);
  if (monthNameMatch) {
    const day = Number(monthNameMatch[1]);
    const monthIndex = MONTHS.indexOf(monthNameMatch[2].toLowerCase());
    const year = Number(monthNameMatch[3]);
    if (monthIndex !== -1) {
      const iso = toIsoDate(year, monthIndex + 1, day);
      if (iso) return iso;
    }
  }

  const slashMatch = text.match(DATE_SLASH_PATTERN);
  if (slashMatch) {
    // Day-first by default; only fall back to month-first if that's invalid.
    const first = Number(slashMatch[1]);
    const second = Number(slashMatch[2]);
    const year = Number(slashMatch[3]);
    const iso = toIsoDate(year, second, first) ?? toIsoDate(year, first, second);
    if (iso) return iso;
  }

  return null;
}
