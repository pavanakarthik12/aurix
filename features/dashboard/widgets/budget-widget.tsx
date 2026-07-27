"use client";

import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/format";
import { useExpensesStore } from "@/store/expenses-store";
import { categoryTotals, getMonthlyTransactions } from "@/lib/financial-engine";

const BUDGET_LIMITS: Record<string, number> = {
  food: 12000,
  shopping: 8000,
  transport: 6000,
  entertainment: 3000,
  utilities: 5000,
  health: 3000,
  housing: 20000,
  other: 3000,
};

export function BudgetWidget() {
  const transactions = useExpensesStore((s) => s.transactions);
  const monthlyTxs = useMemo(() => getMonthlyTransactions(transactions, 1), [transactions]);
  const totals = useMemo(() => categoryTotals(monthlyTxs), [monthlyTxs]);

  const budgets = Object.entries(BUDGET_LIMITS)
    .map(([category, limit]) => ({
      label: category.charAt(0).toUpperCase() + category.slice(1),
      spent: totals[category] || 0,
      limit,
    }))
    .filter((b) => b.spent > 0 || b.limit > 0);

  if (budgets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Budget</CardTitle>
          <CardDescription>Tracked against your set limits</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Add transactions to see budget tracking.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Budget</CardTitle>
        <CardDescription>Tracked against your set limits</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {budgets.map((b) => {
          const pct = Math.min(100, Math.round((b.spent / b.limit) * 100));
          const nearLimit = pct >= 90;
          return (
            <div key={b.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{b.label}</span>
                <span className="text-muted-foreground">
                  {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                </span>
              </div>
              <Progress value={pct} indicatorClassName={nearLimit ? "bg-warning" : undefined} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
