import type { FinancialHealthScore, TimelineEvent, Transaction } from "@/types/finance";
import { autoRecalculateHealthScore, computeHealthHistory, getMonthlyTransactions, totalSpending } from "@/lib/financial-engine";
import { useExpensesStore } from "@/store/expenses-store";
import { useGoalsStore } from "@/store/goals-store";
import { apiPost } from "@/lib/api-client";
import { isAIReal } from "@/lib/config";

function getTransactions(): Transaction[] {
  if (typeof window === "undefined") return [];
  try {
    return useExpensesStore.getState().transactions || [];
  } catch {
    return [];
  }
}

function getGoals() {
  if (typeof window === "undefined") return [];
  try {
    return useGoalsStore.getState().goals || [];
  } catch {
    return [];
  }
}

function getIncome(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem("aurix-income");
    const parsed = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function calculateHealthScoreLocal(): FinancialHealthScore {
  const transactions = getTransactions();
  const goals = getGoals();
  const income = getIncome();

  if (income <= 0) {
    return {
      overall: 0,
      savingsRate: 0,
      debtRatio: 0,
      emergencyFund: 0,
      expenseStability: 0,
      budgetAdherence: 0,
      goalProgress: goals.length > 0 ? Math.round(goals.reduce((s, g) => s + (g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0), 0) / goals.length) : 0,
      incomeGrowth: 0,
      investmentRatio: 0,
      trend: "stable",
      change: 0,
      explanation: "Add your monthly income to calculate a reliable Financial Health Score.",
      recommendations: ["Set your income in onboarding or profile settings, then refresh the dashboard."],
    };
  }

  const currentMonthTxs = getMonthlyTransactions(transactions, 1);
  const currentSpending = totalSpending(currentMonthTxs);
  const baseScore = autoRecalculateHealthScore(transactions, goals, income);
  const history = computeHealthHistory(transactions, goals, income);

  // Calculate trend
  const trend = history.length >= 2 && history[history.length - 1].overall > history[history.length - 2].overall
    ? "up"
    : history.length >= 2 && history[history.length - 1].overall < history[history.length - 2].overall
      ? "down"
      : "stable";
  
  const change = history.length >= 2
    ? history[history.length - 1].overall - history[history.length - 2].overall
    : 0;

  // Don't use hardcoded values - calculate or leave undefined
  return {
    overall: baseScore.overall,
    savingsRate: baseScore.savingsRate,
    debtRatio: baseScore.debtRatio || 0,
    emergencyFund: baseScore.emergencyFund || 0,
    expenseStability: baseScore.expenseStability || 0,
    budgetAdherence: baseScore.budgetAdherence,
    goalProgress: baseScore.goalProgress,
    incomeGrowth: baseScore.incomeGrowth || 0,
    investmentRatio: baseScore.investmentRatio || 0,
    trend,
    change,
    explanation: `${baseScore.explanation} Current month spending is ₹${currentSpending.toLocaleString()} across ${currentMonthTxs.length} transactions.`,
    recommendations: baseScore.recommendations,
  };
}

export async function getFinancialHealthScore(): Promise<FinancialHealthScore> {
  const income = getIncome();
  
  // Try backend first if AI is real and income is set
  if (isAIReal() && income > 0) {
    try {
      const response = await apiPost<{
        overall: number;
        savingsRate: number | null;
        debtRatio: number | null;
        emergencyFund: number | null;
        expenseStability: number | null;
        budgetAdherence: number | null;
        goalProgress: number | null;
        incomeGrowth: number | null;
        investmentRatio: number | null;
        trend: string;
        change: number;
        explanation: string;
        recommendations: string[];
      }>("/api/v1/intelligence/summary", { income }, { maxRetries: 1 });
      
      return {
        overall: response.overall || 0,
        savingsRate: response.savingsRate || 0,
        debtRatio: response.debtRatio || 0,
        emergencyFund: response.emergencyFund || 0,
        expenseStability: response.expenseStability || 0,
        budgetAdherence: response.budgetAdherence || 0,
        goalProgress: response.goalProgress || 0,
        incomeGrowth: response.incomeGrowth || 0,
        investmentRatio: response.investmentRatio || 0,
        trend: (response.trend as "up" | "down" | "stable") || "stable",
        change: response.change || 0,
        explanation: response.explanation,
        recommendations: response.recommendations,
      };
    } catch (error) {
      console.warn("Backend health score failed, using local calculation:", error);
    }
  }
  
  return calculateHealthScoreLocal();
}

export function getTimelineEvents(): TimelineEvent[] {
  const transactions = getTransactions();
  const goals = getGoals();
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

  for (const goal of goals) {
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

  return events;
}