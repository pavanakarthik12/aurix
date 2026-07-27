"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Receipt, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useExpensesStore } from "@/store/expenses-store";
import type { ExpenseCategory } from "@/types/finance";

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "food", label: "Food & Dining" },
  { value: "transport", label: "Transport" },
  { value: "shopping", label: "Shopping" },
  { value: "entertainment", label: "Entertainment" },
  { value: "utilities", label: "Utilities" },
  { value: "health", label: "Health" },
  { value: "housing", label: "Housing" },
  { value: "other", label: "Other" },
];

interface FormState {
  merchant: string;
  amount: string;
  category: ExpenseCategory;
  date: string;
}

const INITIAL_FORM: FormState = {
  merchant: "",
  amount: "",
  category: "other",
  date: new Date().toISOString().split("T")[0],
};

export function ManualEntry() {
  const addTransaction = useExpensesStore((s) => s.addTransaction);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!form.merchant.trim() || isNaN(amount) || amount <= 0) return;

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 300));
    addTransaction({
      merchant: form.merchant.trim(),
      amount: Math.round(amount),
      category: form.category,
      date: form.date,
      source: "manual",
    });
    setSubmitting(false);
    setDone(true);
    setForm(INITIAL_FORM);
    setTimeout(() => setDone(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Entry</CardTitle>
        <CardDescription>Add an expense manually</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Merchant</label>
            <Input
              value={form.merchant}
              onChange={(e) => setForm((f) => ({ ...f, merchant: e.target.value }))}
              placeholder="e.g. Starbucks, Amazon, Uber"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Amount (₹)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ExpenseCategory }))}
                className="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Date</label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting || !form.merchant.trim() || !form.amount || parseFloat(form.amount) <= 0}>
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Adding...</>
            ) : done ? (
              <><CheckCircle2 className="h-4 w-4" /> Added!</>
            ) : (
              <><Plus className="h-4 w-4" /> Add Expense</>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
