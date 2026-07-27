"use client";

import { useMemo } from "react";
import { Lightbulb } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useExpensesStore } from "@/store/expenses-store";
import { useGoalsStore } from "@/store/goals-store";
import { analyzeWeekendVsWeekday, analyzeMerchantFrequency, detectSpendingSpikes, categoryInsights, generateExpenseAnalysis, totalSpending, getMonthlyTransactions } from "@/lib/financial-engine";

export function QuickInsights() {
  const transactions = useExpensesStore((s) => s.transactions);
  const goals = useGoalsStore((s) => s.goals);
  const analysis = useMemo(() => generateExpenseAnalysis(transactions), [transactions]);
  const weekend = useMemo(() => analyzeWeekendVsWeekday(transactions), [transactions]);
  const merchant = useMemo(() => analyzeMerchantFrequency(transactions), [transactions]);
  const spikes = useMemo(() => detectSpendingSpikes(transactions), [transactions]);
  const catInsights = useMemo(() => categoryInsights(analysis), [analysis]);

  const allInsights = [
    ...catInsights.slice(0, 2),
    ...weekend.insights.slice(0, 1),
    ...merchant.insights.slice(0, 1),
    ...spikes.slice(0, 1),
  ];

  if (allInsights.length === 0) {
    const spending = totalSpending(getMonthlyTransactions(transactions, 1));
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quick Insights</CardTitle>
          <CardDescription>Patterns Aurix noticed in your finances</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {transactions.length > 0
              ? `You have ${transactions.length} transactions totaling ₹${spending.toLocaleString()}. Add more data for personalized insights.`
              : "Add transactions to see spending insights."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Insights</CardTitle>
        <CardDescription>Patterns Aurix noticed in your finances</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {allInsights.slice(0, 4).map((insight) => (
          <div key={insight.id} className="flex gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
              <Lightbulb className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">{insight.title}</p>
              <p className="text-xs text-muted-foreground">{insight.description}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
