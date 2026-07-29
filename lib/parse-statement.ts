import { parseFlexibleDate } from "@/lib/dates";
import { categorizeExpenseMl } from "@/lib/ml-categorize";
import type { ExpenseCategory } from "@/types/finance";

export interface StatementRow {
  merchant: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
}

export interface StatementParseResult {
  rows: StatementRow[];
  skippedCount: number;
  error: string | null;
  detectedBank: "sbi" | "hdfc" | "icici" | "generic";
}

const DATE_HEADERS = ["date", "txn date", "transaction date", "value date", "value dt", "txn dt"];
const DESCRIPTION_HEADERS = ["description", "narration", "particulars", "details", "remarks", "transaction remarks"];
const DEBIT_HEADERS = ["debit", "withdrawal", "withdrawal amt", "debit amount", "withdrawal amt.", "dr amt"];
const CREDIT_HEADERS = ["credit", "deposit", "deposit amt", "credit amount", "deposit amt.", "cr amt"];
const AMOUNT_HEADERS = ["amount", "amount (inr)", "txn amount"];
const TYPE_HEADERS = ["type", "dr/cr", "transaction type", "cr/dr"];

function detectBankFormat(headers: string[]): "sbi" | "hdfc" | "icici" | "generic" {
  const headerStr = headers.join(" ");
  if (headerStr.includes("txn date") && headerStr.includes("ref no./cheque no.")) {
    return "sbi";
  }
  if (headerStr.includes("chq./ref.no.") && headerStr.includes("narration")) {
    return "hdfc";
  }
  if (headerStr.includes("value dt") && headerStr.includes("particulars")) {
    return "icici";
  }
  return "generic";
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function findColumn(headers: string[], candidates: string[]): number {
  return headers.findIndex((h) => candidates.some((c) => h === c || h.includes(c)));
}

function parseAmount(raw: string | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[₹,\s]/g, "");
  if (cleaned === "" || cleaned === "-") return null;
  const value = parseFloat(cleaned);
  return Number.isNaN(value) ? null : value;
}

/**
 * Parses a bank statement exported as CSV into a list of expense (debit)
 * transactions. Supports both split debit/credit columns and a single
 * amount column paired with a Dr/Cr type indicator — the two most common
 * export formats from Indian banks.
 */
export function parseStatementCsv(csvText: string): StatementParseResult {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return { rows: [], skippedCount: 0, error: "File is empty or has no data rows.", detectedBank: "generic" };
  }

  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
  const detectedBank = detectBankFormat(headers);

  const dateCol = findColumn(headers, DATE_HEADERS);
  const descCol = findColumn(headers, DESCRIPTION_HEADERS);
  const debitCol = findColumn(headers, DEBIT_HEADERS);
  const creditCol = findColumn(headers, CREDIT_HEADERS);
  const amountCol = findColumn(headers, AMOUNT_HEADERS);
  const typeCol = findColumn(headers, TYPE_HEADERS);

  if (dateCol === -1 || descCol === -1 || (debitCol === -1 && amountCol === -1)) {
    return {
      rows: [],
      skippedCount: 0,
      error:
        "Couldn't detect statement columns. Expected headers like Date, Description/Narration, and Debit or Amount.",
      detectedBank,
    };
  }

  const rows: StatementRow[] = [];
  let skippedCount = 0;

  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line);
    const description = cells[descCol]?.trim();
    const date = parseFlexibleDate(cells[dateCol] ?? "");

    if (!description || !date) {
      skippedCount++;
      continue;
    }

    let amount: number | null = null;

    if (debitCol !== -1 || creditCol !== -1) {
      const debit = debitCol !== -1 ? parseAmount(cells[debitCol]) : null;
      const credit = creditCol !== -1 ? parseAmount(cells[creditCol]) : null;
      // Only debits (money out) count as expenses; credited rows are income.
      amount = debit && debit > 0 ? debit : null;
      if (!amount && credit && credit > 0) {
        skippedCount++;
        continue;
      }
    } else {
      const raw = parseAmount(cells[amountCol]);
      const type = typeCol !== -1 ? cells[typeCol]?.trim().toLowerCase() : null;
      if (type) {
        const isCredit = type.startsWith("cr") || type.includes("credit");
        amount = isCredit ? null : raw;
        if (isCredit) {
          skippedCount++;
          continue;
        }
      } else {
        // No type column to disambiguate — assume positive amounts are debits.
        amount = raw !== null && raw > 0 ? raw : null;
      }
    }

    if (amount === null || amount <= 0) {
      skippedCount++;
      continue;
    }

    const { category } = categorizeExpenseMl(description);
    rows.push({ merchant: description, amount, date, category });
  }

  return { rows, skippedCount, error: null, detectedBank };
}
