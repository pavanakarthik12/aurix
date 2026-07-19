import { categorizeExpense } from "@/lib/categorize";
import type { ExpenseCategory } from "@/types/finance";

export interface ParsedExpense {
  merchant: string;
  amount: number | null;
  date: string;
  category: ExpenseCategory;
  rawText: string;
  confidence: "high" | "medium" | "low";
}

const AMOUNT_PATTERN = /(?:₹|rs\.?|inr)\s?([\d,]+(?:\.\d{1,2})?)/gi;
const BARE_NUMBER_PATTERN = /\b\d[\d,]{1,9}(?:\.\d{1,2})?\b/g;
const DATE_SLASH_PATTERN = /\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/;
const DATE_ISO_PATTERN = /\b(\d{4})-(\d{2})-(\d{2})\b/;
const DATE_MONTH_NAME_PATTERN =
  /\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{2,4})\b/i;

const NOISE_LINES = [
  "paid", "successful", "payment", "transaction", "upi", "ref no",
  "reference", "transaction id", "utr", "status",
];

function extractAmount(text: string): number | null {
  const matches = [...text.matchAll(AMOUNT_PATTERN)];
  const amounts = matches
    .map((m) => parseFloat(m[1].replace(/,/g, "")))
    .filter((n) => !Number.isNaN(n) && n > 0);

  if (amounts.length > 0) {
    return Math.max(...amounts);
  }

  const bareMatches = [...text.matchAll(BARE_NUMBER_PATTERN)];
  const bareAmounts = bareMatches
    .map((m) => parseFloat(m[0].replace(/,/g, "")))
    .filter((n) => {
      if (Number.isNaN(n) || n <= 0 || n >= 10_000_000) return false;
      const isLikelyYear = Number.isInteger(n) && n >= 1900 && n <= 2099;
      return !isLikelyYear;
    });

  return bareAmounts.length > 0 ? Math.max(...bareAmounts) : null;
}

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

function extractDate(text: string): string {
  const today = new Date().toISOString().slice(0, 10);

  const isoMatch = text.match(DATE_ISO_PATTERN);
  if (isoMatch) {
    const iso = toIsoDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
    if (iso) return iso;
  }

  const monthNameMatch = text.match(DATE_MONTH_NAME_PATTERN);
  if (monthNameMatch) {
    const parsed = new Date(`${monthNameMatch[1]} ${monthNameMatch[2]} ${monthNameMatch[3]}`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  }

  const slashMatch = text.match(DATE_SLASH_PATTERN);
  if (slashMatch) {
    // Indian receipts use DD/MM/YYYY — day first, not the US MM/DD/YYYY that
    // JS's Date constructor assumes for slash-separated strings. Try that
    // reading first and only fall back to MM/DD/YYYY if it's not a valid date.
    const first = Number(slashMatch[1]);
    const second = Number(slashMatch[2]);
    const year = Number(slashMatch[3]);
    const iso = toIsoDate(year, second, first) ?? toIsoDate(year, first, second);
    if (iso) return iso;
  }

  return today;
}

const STANDALONE_NOISE_WORDS = new Set(["to", "from"]);

function extractMerchant(text: string): string {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 2);

  const candidate = lines.find((line) => {
    const lower = line.toLowerCase();
    const words = lower.split(/\s+/);
    const isNoise =
      NOISE_LINES.some((noise) => lower.includes(noise)) ||
      (words.length === 1 && STANDALONE_NOISE_WORDS.has(words[0]));
    const isMostlyDigits = /^[\d\s.,₹/\-:]+$/.test(line);
    return !isNoise && !isMostlyDigits;
  });

  return candidate ?? "Unknown Merchant";
}

export function parseReceiptText(rawText: string): ParsedExpense {
  const amount = extractAmount(rawText);
  const merchant = extractMerchant(rawText);
  const date = extractDate(rawText);
  const category = categorizeExpense(`${merchant} ${rawText}`);

  let confidence: ParsedExpense["confidence"] = "low";
  if (amount !== null && merchant !== "Unknown Merchant") {
    confidence = "high";
  } else if (amount !== null || merchant !== "Unknown Merchant") {
    confidence = "medium";
  }

  return { merchant, amount, date, category, rawText, confidence };
}
