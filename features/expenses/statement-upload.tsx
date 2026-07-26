"use client";

import { useRef, useState } from "react";
import { FileText, Upload, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/format";
import { parseStatementCsv, type StatementRow } from "@/lib/parse-statement";
import { useExpensesStore } from "@/store/expenses-store";

type Stage = "idle" | "review" | "done";

export function StatementUpload() {
  const [stage, setStage] = useState<Stage>("idle");
  const [rows, setRows] = useState<StatementRow[]>([]);
  const [skippedCount, setSkippedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [addedCount, setAddedCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const addTransactions = useExpensesStore((s) => s.addTransactions);

  const handleFile = (file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const result = parseStatementCsv(text);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.rows.length === 0) {
        setError("No valid expense rows found in this file.");
        return;
      }
      setRows(result.rows);
      setSkippedCount(result.skippedCount);
      setStage("review");
    };
    reader.onerror = () => setError("Couldn't read this file.");
    reader.readAsText(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setStage("idle");
    setRows([]);
    setSkippedCount(0);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const confirmImport = () => {
    addTransactions(
      rows.map((row) => ({
        merchant: row.merchant,
        amount: row.amount,
        date: row.date,
        category: row.category,
        source: "statement" as const,
      }))
    );
    setAddedCount(rows.length);
    setStage("done");
    setTimeout(reset, 2200);
  };

  if (stage === "idle") {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 border-dashed p-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <FileText className="h-6 w-6" />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">
            Upload a bank statement CSV
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Exported statement with Date, Description, and Debit/Amount columns
          </p>
        </div>
        <Button size="sm" onClick={() => inputRef.current?.click()}>
          <Upload className="h-4 w-4" />
          Choose CSV file
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={onFileChange}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </Card>
    );
  }

  if (stage === "review") {
    const total = rows.reduce((sum, r) => sum + r.amount, 0);
    return (
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                Found {rows.length} expense{rows.length === 1 ? "" : "s"} — {formatCurrency(total)} total
              </p>
              {skippedCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  {skippedCount} row{skippedCount === 1 ? "" : "s"} skipped (credits or unparseable rows)
                </p>
              )}
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto rounded-lg border border-border">
            <ul className="divide-y divide-border">
              {rows.map((row, i) => (
                <li key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{row.merchant}</p>
                    <p className="text-xs text-muted-foreground">
                      {CATEGORY_LABELS[row.category]} · {formatDate(row.date)}
                    </p>
                  </div>
                  <Badge variant="muted">{CATEGORY_LABELS[row.category]}</Badge>
                  <p className="shrink-0 text-sm font-semibold text-foreground">
                    −{formatCurrency(row.amount)}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={reset}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button size="sm" onClick={confirmImport}>
              <Check className="h-4 w-4" />
              Import {rows.length} expenses
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col items-center gap-2 p-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-success">
        <Check className="h-5 w-5" />
      </span>
      <p className="text-sm font-medium text-foreground">
        {addedCount} expense{addedCount === 1 ? "" : "s"} imported
      </p>
    </Card>
  );
}
