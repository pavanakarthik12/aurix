import { NextRequest, NextResponse } from "next/server";
import { isOCRReal } from "@/lib/config";
import { extractFromSource, validateOCRConfidence, type OCRSource } from "@/services/ocr-service";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) || "receipt";

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString("base64");

    const source: OCRSource = {
      type: type as OCRSource["type"],
      base64Data,
      mimeType: file.type || "image/jpeg",
      filename: file.name,
    };

    const result = await extractFromSource(source);
    const validation = validateOCRConfidence(result);

    const extractService = "real-ocr-service";

    return NextResponse.json({
      transaction: {
        merchant: result.merchant,
        amount: result.amount,
        date: result.date,
        currency: result.currency,
        category: result.category,
        subcategory: result.subcategory,
        paymentMethod: result.paymentMethod,
        tax: result.tax,
        referenceNumber: result.referenceNumber,
      },
      confidence: result.confidence,
      flags: validation.flags,
      rawText: result.rawText,
      method: result.method,
      source: extractService,
    });
  } catch (err) {
    console.error("OCR API error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    provider: isOCRReal() ? "live" : "mock",
    status: "operational",
    supportedTypes: ["receipt", "statement", "screenshot", "invoice"],
  });
}
