"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useExpensesStore } from "@/store/expenses-store";
import { useGoalsStore } from "@/store/goals-store";
import { usePersonaStore } from "@/store/persona-store";
import { totalSpending, getMonthlyTransactions, savingsRate } from "@/lib/financial-engine";
import { formatCurrency, formatCompactNumber } from "@/lib/format";
import { Server, Clock, TrendingUp, TrendingDown } from "lucide-react";

interface PerformanceSummaryStats {
  transactions: number;
  goals: number;
  monthlyIncome: number;
  spending: number;
  savings: number;
  savingsRate: number;
}

export function PerformanceSummaryCard({ stats }: {
  stats: PerformanceSummaryStats;
}) {
  const { transactions, goals, monthlyIncome, spending, savings, savingsRate } = stats;

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle>
          <Server className="h-4 w-4 mr-2" /> System Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-muted-foreground">Transactions</div>
            <div className="font-medium">{transactions}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Goals</div>
            <div className="font-medium">{goals}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Monthly Income</div>
            <div className="font-medium">₹{formatCompactNumber(monthlyIncome)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Monthly Spending</div>
            <div className="font-medium">₹{formatCurrency(spending)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Savings</div>
            <div className="font-medium">₹{formatCurrency(savings)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Savings Rate</div>
            <div className="font-medium">
              {savingsRate >= 20 ? "Excellent" : savingsRate >= 10 ? "Good" : "Needs improvement"}
              {` ({Math.round(savingsRate)}%`}`
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-muted-foreground">System Uptime</span>
            <Badge variant="success" className="mt-1">
              <Server className="h-3.5 w-3.5 mr-1" /> Online
            </Badge>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Last Benchmark</span>
            <Badge variant="muted" className="mt-1">
              <Clock className="h-3.5 w-3.5 mr-1" /> —
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}