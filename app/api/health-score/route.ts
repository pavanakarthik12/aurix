import { NextRequest, NextResponse } from "next/server";
import { isAIReal } from "@/lib/config";
import { chatWithAI } from "@/services/ai-client";
import { EXPENSE_BREAKDOWN, SPENDING_TREND, MOCK_GOALS } from "@/lib/mock-data";
import {
  generateExpenseAnalysis,
  totalSpending,
  savingsRate as calcSavingsRate,
  getMonthlyTransactions,
} from "@/lib/financial-engine";
import type { Transaction, FinancialGoal } from "@/types/finance";

interface HealthScoreFactors {
  savingsRate: number;
  debtRatio: number;
  emergencyFund: number;
  expenseStability: number;
  budgetAdherence: number;
  goalProgress: number;
  incomeGrowth: number;
  investmentRatio: number;
}

function calculateHealthScore(factors: HealthScoreFactors): {
  overall: number;
  factors: HealthScoreFactors;
  explanation: string;
  recommendations: string[];
} {
  const weights = {
    savingsRate: 0.2,
    debtRatio: 0.15,
    emergencyFund: 0.15,
    expenseStability: 0.12,
    budgetAdherence: 0.12,
    goalProgress: 0.1,
    incomeGrowth: 0.08,
    investmentRatio: 0.08,
  };

  const overall = Math.round(
    Object.entries(weights).reduce((sum, [key, weight]) => {
      return sum + (factors[key as keyof HealthScoreFactors] || 0) * weight;
    }, 0)
  );

  const factorLabels: Record<string, string> = {
    savingsRate: "Savings Rate",
    debtRatio: "Debt Ratio",
    emergencyFund: "Emergency Fund",
    expenseStability: "Expense Stability",
    budgetAdherence: "Budget Adherence",
    goalProgress: "Goal Progress",
    incomeGrowth: "Income Growth",
    investmentRatio: "Investment Allocation",
  };

  const sortedByWeakest = Object.entries(factors)
    .sort(([, a], [, b]) => a - b)
    .slice(0, 3);

  const explanations = sortedByWeakest.map(
    ([k, v]) => `${factorLabels[k] || k}: ${v}/100 — ${v >= 80 ? "Excellent" : v >= 60 ? "Moderate" : "Needs attention"}`
  );

  return {
    overall,
    factors,
    explanation: `Your Financial Health Score is ${overall}/100. ${overall >= 80 ? "Strong financial health overall." : overall >= 60 ? "Moderate — room for improvement across several factors." : "Needs attention — focus on building foundational financial habits."}\n\nBreakdown:\n${explanations.join("\n")}`,
    recommendations: sortedByWeakest.map(
      ([k, v]) => `Improve your ${factorLabels[k] || k} (currently ${v}/100). ${k === "savingsRate" ? "Aim to save at least 20% of income." : k === "emergencyFund" ? "Build a 3-6 month emergency fund." : k === "investmentRatio" ? "Consider increasing investment allocation to 15-20% of income." : `Focus on strengthening this area to boost your overall score.`}`
    ),
  };
}

function calculateFactors(): HealthScoreFactors {
  const currentTotal = EXPENSE_BREAKDOWN.reduce((s, c) => s + c.amount, 0);
  const monthlyIncome = 75000;
  const savings = monthlyIncome - currentTotal;
  const rate = (savings / monthlyIncome) * 100;

  const recentMonths = SPENDING_TREND.slice(-3);
  const spendingValues = recentMonths.map((m) => m.spending);
  const spendingMean = spendingValues.reduce((a, b) => a + b, 0) / spendingValues.length;
  const spendingVariance = spendingValues.reduce((s, v) => s + Math.pow(v - spendingMean, 2), 0) / spendingValues.length;
  const stabilityScore = Math.max(0, 100 - spendingVariance / 500);

  const goalProgressValues = MOCK_GOALS.map((g) =>
    g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0
  );
  const avgGoalProgress = goalProgressValues.length > 0
    ? goalProgressValues.reduce((s, v) => s + v, 0) / goalProgressValues.length
    : 0;

  return {
    savingsRate: Math.min(100, Math.round((rate / 30) * 100)),
    debtRatio: 82,
    emergencyFund: 70,
    expenseStability: Math.round(Math.max(0, Math.min(100, stabilityScore))),
    budgetAdherence: Math.round(100 - (currentTotal > monthlyIncome ? ((currentTotal - monthlyIncome) / monthlyIncome) * 100 : 0)),
    goalProgress: Math.round(avgGoalProgress),
    incomeGrowth: 68,
    investmentRatio: 52,
  };
}

export async function GET(req: NextRequest) {
  try {
    const factors = calculateFactors();
    const result = calculateHealthScore(factors);

    return NextResponse.json({
      ...result,
      trend: factors.savingsRate > 65 ? "up" as const : "stable" as const,
      change: factors.savingsRate - 60 > 0 ? 3 : 0,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Health score error:", err);
    return NextResponse.json({ error: "Failed to calculate health score" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transactions, goals } = body as {
      transactions?: { amount: number; category: string }[];
      goals?: { current: number; target: number }[];
    };

    const factors = calculateFactors();
    const result = calculateHealthScore(factors);

    if (isAIReal()) {
      try {
        const aiInsight = await chatWithAI(
          [
            {
              role: "system",
              content: `You are a financial health analyst. Given a user's Financial Health Score of ${result.overall}/100 and factor breakdown, provide 3 specific, actionable recommendations based on the actual numbers.

Factor Breakdown:
${Object.entries(factors).map(([k, v]) => `${k}: ${v}/100`).join("\n")}

Return JSON array only: [{ "title": "string with specific metric target", "description": "string with actionable steps" }]

Never give generic advice like "save more". Be specific with numbers.`,
            },
            {
              role: "user",
              content: `Current score: ${result.overall}/100. Provide improved, specific recommendations with numerical targets.`,
            },
          ],
          { temperature: 0.4, maxTokens: 512 }
        );

        try {
          const aiRecs = JSON.parse(aiInsight);
          result.recommendations = aiRecs.map((r: { title: string }) => r.title);
        } catch {}
      } catch {}
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: "Failed to calculate health score" }, { status: 500 });
  }
}
