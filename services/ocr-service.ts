import { config, isOCRReal } from "@/lib/config";
import { processReceiptOCR } from "./ai-client";
import { getFallbackOCR } from "./ocr-fallback";

export type OCRSourceType = "receipt" | "statement" | "screenshot" | "invoice";

export interface OCRSource {
  type: OCRSourceType;
  base64Data: string;
  mimeType: string;
  filename: string;
}

export interface OCRResult {
  merchant: string;
  amount: number;
  date: string;
  currency: string;
  category: string;
  subcategory?: string;
  paymentMethod?: string;
  tax?: number;
  referenceNumber?: string;
  confidence: number;
  sourceType: OCRSourceType;
  rawText: string;
  method: "tesseract" | "backend" | "mock";
}

export async function extractFromSource(source: OCRSource): Promise<OCRResult> {
  if (isOCRReal()) {
    try {
      const result = await processReceiptOCR({
        base64Image: source.base64Data,
        mimeType: source.mimeType,
      });
      return {
        ...result,
        sourceType: source.type,
        method: "backend",
      };
    } catch (err) {
      console.warn("Backend OCR failed, falling back to local parser:", err);
    }
  }

  const fallback = getFallbackOCR(source);
  return {
    merchant: fallback.merchant,
    amount: fallback.amount,
    date: fallback.date,
    currency: "INR",
    category: fallback.category,
    confidence: fallback.confidence,
    sourceType: source.type,
    rawText: fallback.rawText,
    method: "mock",
  };
}

export function validateOCRConfidence(result: OCRResult): {
  valid: boolean;
  flags: string[];
} {
  const flags: string[] = [];
  if (result.confidence < 50) flags.push("Low confidence — manual review recommended");
  if (result.amount === 0) flags.push("Amount could not be extracted");
  if (result.merchant === "Unknown") flags.push("Merchant name could not be determined");
  return { valid: flags.length === 0, flags };
}
