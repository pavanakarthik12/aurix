"use client";

import { useMemo } from "react";
import { Wallet, TrendingDown, TrendingUp, Activity } from "lucide-react";
import { StatTile } from "@/components/shared/stat-tile";
import { useExpensesStore } from "@/store/expenses-store";
import { useGoalsStore } from "@/store/goals-store";
import { totalSpending, getMonthlyTransactions, savingsRate } from "@/lib/financial-engine";

export function OverviewStats() {
  const transactions = useExpensesStore((s) => s.transactions);
  const goals = useGoalsStore((s) => s.goals);
  const currentMonthTxs = useMemo(() => getMonthlyTransactions(transactions, 1), [transactions]);
  const spending = useMemo(() => totalSpending(currentMonthTxs), [currentMonthTxs]);
  const income = typeof window !== "undefined" ? localStorage.getItem("aurix-income") : null;
  const monthlyIncome = income ? parseInt(income) : 75000;
  const savings = monthlyIncome - spending;
  const rate = savingsRate(monthlyIncome, spending);

  const totalGoalProgress = goals.length > 0
    ? Math.round(goals.reduce((s, g) => s + (g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0), 0) / goals.length)
    : 0;

  const totalAssets = goals.reduce((s, g) => s + g.currentAmount, 0) + savings * 6;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile
        label="Net Worth"
        value={`₹${(totalAssets / 100000).toFixed(1)}L`}
        icon={Wallet}
        trend={totalAssets > 0 ? { value: "Active", direction: "up", positive: true } : undefined}
      />
      <StatTile
        label="Monthly Spending"
        value={`₹${(spending / 1000).toFixed(1)}K`}
        icon={TrendingDown}
        trend={spending > 0 ? { value: `${transactions.length} txns`, direction: "up", positive: spending <= monthlyIncome * 0.7 } : undefined}
      />
      <StatTile
        label="Monthly Savings"
        value={`₹${Math.max(0, savings / 1000).toFixed(1)}K`}
        icon={TrendingUp}
        trend={{ value: `${Math.round(rate)}% rate`, direction: rate >= 20 ? "up" : "down", positive: rate >= 20 }}
      />
      <StatTile
        label="Health Score"
        value={totalGoalProgress > 0 ? `${totalGoalProgress}%` : "--"}
        icon={Activity}
        trend={totalGoalProgress > 60 ? { value: `Goal progress`, direction: "up", positive: true } : totalGoalProgress > 0 ? { value: `Needs focus`, direction: "down", positive: false } : undefined}
      />
    </div>
  );
}
