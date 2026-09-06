"use client";

import { useEffect, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useExpensesStore } from "@/store/expenses-store";
import { useGoalsStore } from "@/store/goals-store";
import { usePersonaStore } from "@/store/persona-store";
import { totalSpending, getMonthlyTransactions, savingsRate, computeMonthlyAverages } from "@/lib/financial-engine";
import { formatCurrency, formatCompactNumber } from "@/lib/format";
import { BarChart3, TrendingUp, TrendingDown, Activity, Calendar } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function AnalyticsPage() {
  const transactions = useExpensesStore((s) => s.transactions);
  const goals = useGoalsStore((s) => s.goals);
  const monthlyIncome = usePersonaStore((s) => s.profile.monthlyIncome || 0);
  const spending = useMemo(() => totalSpending(getMonthlyTransactions(transactions, 1)), [transactions]);
  const rate = savingsRate(monthlyIncome, spending);
  const monthlyData = useMemo(() => computeMonthlyAverages(transactions), [transactions]);

  useEffect(() => {
    document.title = "Aurix - Analytics | Financial Insights";
  }, []);

  return (
    <div className="mx-auto max-w-7xl py-12">
      <PageHeader
        title="Analytics"
        description="Deep insights into your spending patterns, categories, and financial trends."
      />

      <div className="mt-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Spending Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground">Monthly Spending</div>
                <div className="font-medium">₹{formatCurrency(spending)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Savings Rate</div>
                <div className="font-medium">
                  {rate >= 20 ? "Excellent" : rate >= 10 ? "Good" : "Needs improvement"}
                  {` (${Math.round(rate)}%)`}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Transactions This Month</div>
                <div className="font-medium">{getMonthlyTransactions(transactions, 1).length}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Active Goals</div>
                <div className="font-medium">{goals.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Object.entries(monthlyData).slice(0, 8).map(([category, data]) => (
                <div key={category} className="p-3 rounded border-border text-xs">
                  <div className="font-medium text-foreground">{category}</div>
                  <div className="text-primary">{formatCurrency(data.current)}</div>
                  <div className="text-muted-foreground">
                    {data.current > 0 && data.avg3 > 0 
                      ? `${((data.current - data.avg3) / data.avg3 * 100) > 0 ? "+" : ""}${Math.round((data.current - data.avg3) / data.avg3 * 100)}% vs 3-month avg` 
                      : "—"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="spending" className="w-full">
          <TabsList className="flex flex-wrap gap-2">
            <TabsTrigger value="spending" className="sm:px-3 py-1.5 text-xs font-medium transition-colors">
              Spending Trend
            </TabsTrigger>
            <TabsTrigger value="goals" className="sm:px-3 py-1.5 text-xs font-medium transition-colors">
              Goal Progress
            </TabsTrigger>
            <TabsTrigger value="patterns" className="sm:px-3 py-1.5 text-xs font-medium transition-colors">
              Spending Patterns
            </TabsTrigger>
          </TabsList>

          <TabsContent value="spending" className="mt-4">
            <div className="h-64">
              <p className="text-muted-foreground text-center py-8">
                Spending trend chart would appear here based on {transactions.length} transactions
              </p>
            </div>
          </TabsContent>

          <TabsContent value="goals" className="mt-4">
            <div className="h-64">
              <p className="text-muted-foreground text-center py-8">
                Goal progress tracking would appear here for {goals.length} active goals
              </p>
            </div>
          </TabsContent>

          <TabsContent value="patterns" className="mt-4">
            <div className="h-64">
              <p className="text-muted-foreground text-center py-8">
                Spending pattern analysis would appear here
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}