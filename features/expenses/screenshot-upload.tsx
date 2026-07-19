"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { UploadCloud, Loader2, Check, X, ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractTextFromImage } from "@/lib/ocr";
import { parseReceiptText, type ParsedExpense } from "@/lib/parse-receipt";
import { CATEGORY_LABELS } from "@/lib/mock-data";
import { useExpensesStore } from "@/store/expenses-store";
import type { ExpenseCategory } from "@/types/finance";

type Stage = "idle" | "processing" | "review" | "done";

export function ScreenshotUpload() {
  const [stage, setStage] = useState<Stage>("idle");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState("");
  const [parsed, setParsed] = useState<ParsedExpense | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const addTransaction = useExpensesStore((s) => s.addTransaction);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (screenshot of a payment or receipt).");
      return;
    }

    setError(null);
    setStage("processing");
    setOcrProgress(0);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const text = await extractTextFromImage(file, (p) => {
        setOcrStatus(p.status);
        setOcrProgress(Math.round(p.progress * 100));
      });
      const result = parseReceiptText(text);
      setParsed(result);
      setStage("review");
    } catch {
      setError("Couldn't read text from this image. Try a clearer screenshot.");
      setStage("idle");
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setStage("idle");
    setParsed(null);
    setPreviewUrl(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const confirmExpense = () => {
    if (!parsed || parsed.amount === null) return;
    addTransaction({
      merchant: parsed.merchant,
      category: parsed.category,
      amount: parsed.amount,
      date: parsed.date,
      source: "screenshot",
    });
    setStage("done");
    setTimeout(reset, 1800);
  };

  if (stage === "idle") {
    return (
      <Card
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="flex flex-col items-center justify-center gap-3 border-dashed p-10 text-center"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UploadCloud className="h-6 w-6" />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">
            Drag a payment screenshot here, or click to browse
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            PNG or JPG — UPI receipts, bank SMS screenshots, or store receipts
          </p>
        </div>
        <Button size="sm" onClick={() => inputRef.current?.click()}>
          Choose file
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </Card>
    );
  }

  if (stage === "processing") {
    return (
      <Card className="flex flex-col items-center gap-4 p-10 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <div className="w-full max-w-xs space-y-2">
          <p className="text-sm font-medium text-foreground capitalize">
            {ocrStatus || "Reading receipt"}…
          </p>
          <Progress value={ocrProgress} />
        </div>
      </Card>
    );
  }

  if (stage === "review" && parsed) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-4">
          {previewUrl && (
            <div className="hidden h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-border sm:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Uploaded receipt" className="h-full w-full object-cover" />
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Review extracted expense</p>
              <Badge
                variant={
                  parsed.confidence === "high"
                    ? "success"
                    : parsed.confidence === "medium"
                    ? "warning"
                    : "destructive"
                }
              >
                {parsed.confidence} confidence
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="merchant">Merchant</Label>
                <Input
                  id="merchant"
                  value={parsed.merchant}
                  onChange={(e) => setParsed({ ...parsed, merchant: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={parsed.amount ?? ""}
                  onChange={(e) =>
                    setParsed({ ...parsed, amount: e.target.value ? Number(e.target.value) : null })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={parsed.date}
                  onChange={(e) => setParsed({ ...parsed, date: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={parsed.category}
                  onChange={(e) =>
                    setParsed({ ...parsed, category: e.target.value as ExpenseCategory })
                  }
                  className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                >
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={reset}>
                <X className="h-4 w-4" />
                Discard
              </Button>
              <Button size="sm" onClick={confirmExpense} disabled={parsed.amount === null}>
                <Check className="h-4 w-4" />
                Add expense
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col items-center gap-2 p-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-success">
        <Check className="h-5 w-5" />
      </span>
      <p className="text-sm font-medium text-foreground">Expense added</p>
    </Card>
  );
}
