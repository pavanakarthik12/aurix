import type { FinancialHealthScore, TimelineEvent, Transaction, FinancialGoal } from "@/types/finance";
import { EXPENSE_BREAKDOWN, SPENDING_TREND } from "@/lib/mock-data";
import {
  generateExpenseAnalysis,
  totalSpending,
  savingsRate,
  getMonthlyTransactions,
  getGoalsFromStore,
} from "@/lib/financial-engine";
import { useExpensesStore } from "@/store/expenses-store";

function getTransactions(): Transaction[] {
  if (typeof window === "undefined") return [];
  try {
    return useExpensesStore.getState().transactions || [];
  } catch {
    return [];
  }
}

function calculateHealthScoreLocal(): FinancialHealthScore {
  const transactions = getTransactions();
  const hasTransactions = transactions.length > 0;

  let totalSpendingValue: number;
  let monthlyIncome = 75000;
  let savings: number;
  let rate: number;

  if (hasTransactions) {
    const currentMonthTxs = getMonthlyTransactions(transactions, 1);
    totalSpendingValue = totalSpending(currentMonthTxs);
    savings = monthlyIncome - totalSpendingValue;
    rate = savingsRate(monthlyIncome, totalSpendingValue);
  } else {
    totalSpendingValue = EXPENSE_BREAKDOWN.reduce((s, c) => s + c.amount, 0);
    savings = monthlyIncome - totalSpendingValue;
    rate = (savings / monthlyIncome) * 100;
  }

  const analysis = hasTransactions ? generateExpenseAnalysis(transactions) : [];
  const alerts = analysis.filter((a) => a.isAlert);

  const savingsRateScore = Math.min(100, Math.round((rate / 30) * 100));

  const recentMonths = SPENDING_TREND.slice(-3);
  const spendingValues = recentMonths.map((m) => m.spending);
  const spendingMean = spendingValues.reduce((a, b) => a + b, 0) / spendingValues.length;
  const spendingVariance = spendingValues.reduce((s, v) => s + Math.pow(v - spendingMean, 2), 0) / spendingValues.length;
  const stabilityScore = Math.max(0, 100 - spendingVariance / 500);

  const storedGoals = getGoalsFromStore();
  const goalProgressValues = storedGoals.length > 0
    ? storedGoals.map((g) => g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0)
    : [72];
  const avgGoalProgress = goalProgressValues.length > 0
    ? goalProgressValues.reduce((s, v) => s + v, 0) / goalProgressValues.length
    : 72;

  const budgetAdherenceScore = alerts.length === 0
    ? 76
    : Math.max(40, 100 - alerts.length * 15 - alerts.reduce((s, a) => s + Math.abs(a.changeVsAvg3), 0) * 0.2);

  const emergencyFundScore = Math.min(100, Math.round((avgGoalProgress / 100) * 70 + 30));

  const overall = Math.round(
    savingsRateScore * 0.2 +
    82 * 0.15 +
    emergencyFundScore * 0.15 +
    Math.round(stabilityScore) * 0.12 +
    budgetAdherenceScore * 0.12 +
    Math.round(avgGoalProgress) * 0.1 +
    68 * 0.08 +
    52 * 0.08
  );

  const recs: string[] = [];
  if (rate < 20) recs.push(`Increase your savings rate from ${Math.round(rate)}% to 20% of income (₹${Math.round(monthlyIncome * 0.2 - (monthlyIncome - totalSpendingValue))}/mo more)`);
  if (emergencyFundScore < 70) recs.push("Build a 3-6 month emergency fund for financial security");
  if (alerts.length > 0) recs.push(`Review spending in ${alerts.map((a) => a.category).join(", ")} (${alerts.length} categories exceeding normal range)`);
  if (recs.length === 0) recs.push("Maintain your current financial habits — you're on track!");

  return {
    overall,
    savingsRate: savingsRateScore,
    debtRatio: 82,
    emergencyFund: Math.round(emergencyFundScore),
    expenseStability: Math.round(stabilityScore),
    budgetAdherence: Math.round(budgetAdherenceScore),
    goalProgress: Math.round(avgGoalProgress),
    incomeGrowth: 68,
    investmentRatio: 52,
    trend: savingsRateScore > 65 ? "up" : "stable",
    change: overall > 70 ? 3 : overall > 50 ? 1 : -2,
    explanation: `Your Financial Health Score of ${overall}/100 reflects ${rate >= 20 ? "healthy" : rate >= 10 ? "moderate" : "low"} savings (${Math.round(rate)}% rate) based on ${hasTransactions ? transactions.length + " transactions" : "your monthly spending data"}. ${alerts.length > 0 ? alerts.length + " spending categories need attention." : "Spending is within normal ranges."}`,
    recommendations: recs,
  };
}

export async function getFinancialHealthScore(): Promise<FinancialHealthScore> {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/health-score");
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch {}
  }
  return calculateHealthScoreLocal();
}

export function getTimelineEvents(): TimelineEvent[] {
  const transactions = getTransactions();
  const events: TimelineEvent[] = [];

  const recentTxs = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  for (const tx of recentTxs) {
    events.push({
      id: `tx-${tx.id}`,
      type: "expense",
      title: tx.merchant,
      amount: tx.amount,
      date: tx.date,
      category: tx.category,
      status: "completed",
    });
  }

  const storedGoals = getGoalsFromStore();
  const goalsToShow = storedGoals.length > 0 ? storedGoals : [];
  for (const goal of goalsToShow) {
    const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
    events.push({
      id: `goal-${goal.id}`,
      type: "goal",
      title: `${goal.title} Progress`,
      amount: goal.currentAmount,
      date: new Date().toISOString().split("T")[0],
      status: progress >= 100 ? "completed" : "upcoming",
      description: `${Math.round(progress)}% of ₹${(goal.targetAmount / 100000).toFixed(1)}L target reached`,
    });
  }

  if (events.length === 0) {
    return [
      {
        id: "evt-1", type: "expense", title: "Blue Tokai Coffee", amount: 480,
        date: "2026-07-18", category: "food", status: "completed",
      },
      {
        id: "evt-2", type: "savings", title: "Monthly SIP Contribution", amount: 5000,
        date: "2026-07-15", status: "completed", description: "Auto-invested in index fund",
      },
      {
        id: "evt-3", type: "bill", title: "Rent Payment", amount: 18000,
        date: "2026-07-05", status: "completed",
      },
    ];
  }

  return events;
}
