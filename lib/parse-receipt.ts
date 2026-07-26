import { categorizeExpenseMl } from "@/lib/ml-categorize";
import { parseFlexibleDate } from "@/lib/dates";
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
  const date = parseFlexibleDate(rawText) ?? new Date().toISOString().slice(0, 10);
  const { category } = categorizeExpenseMl(`${merchant} ${rawText}`);

  let confidence: ParsedExpense["confidence"] = "low";
  if (amount !== null && merchant !== "Unknown Merchant") {
    confidence = "high";
  } else if (amount !== null || merchant !== "Unknown Merchant") {
    confidence = "medium";
  }

  return { merchant, amount, date, category, rawText, confidence };
}
