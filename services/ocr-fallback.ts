import type { OCRSource } from "./ocr-service";

interface FallbackOCRResult {
  merchant: string;
  amount: number;
  date: string;
  category: string;
  confidence: number;
  rawText: string;
}

const KNOWN_MERCHANTS = [
  { pattern: /starbucks|blue tokai|cafe|coffee|barista/i, category: "food" },
  { pattern: /uber|ola|metro|bus|petrol|fuel|indian oil|bharat/i, category: "transport" },
  { pattern: /amazon|flipkart|myntra|meesho|ajio/i, category: "shopping" },
  { pattern: /swiggy|zomato|dunzo|blinkit|zepto/i, category: "food" },
  { pattern: /netflix|prime|hotstar|spotify|youtube|bookmyshow/i, category: "entertainment" },
  { pattern: /apollo|medplus|pharmacy|hospital|doctor|clinic/i, category: "health" },
  { pattern: /rent|landlord|housing/i, category: "housing" },
  { pattern: /bescom|electricity|water|broadband|airtel|jio|vodafone/i, category: "utilities" },
];

function detectCategory(text: string): string {
  for (const entry of KNOWN_MERCHANTS) {
    if (entry.pattern.test(text)) return entry.category;
  }
  return "other";
}

export function getFallbackOCR(source: OCRSource): FallbackOCRResult {
  const rawText = atob(source.base64Data).slice(0, 2000).replace(/[^\w\s₹$€£.,\/\-\n]/g, "");
  const lines = rawText.split("\n").filter(Boolean);

  const merchantLine = lines.find((l) => l.length > 3 && l.length < 60 && /^[A-Za-z]/.test(l));
  const amountMatch = rawText.match(/(?:total|amount|due|pay|rs\.?|₹)\s*([\d,]+\.?\d*)/i);
  const dateMatch = rawText.match(/\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/);

  return {
    merchant: merchantLine || "Unknown Merchant",
    amount: amountMatch ? parseFloat(amountMatch[1].replace(/,/g, "")) : 0,
    date: dateMatch ? dateMatch[0] : new Date().toISOString().split("T")[0],
    category: detectCategory(rawText),
    confidence: 45,
    rawText,
  };
}
