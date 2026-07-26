import { NextRequest, NextResponse } from "next/server";
import { isAIReal } from "@/lib/config";
import { chatWithAI } from "@/services/ai-client";
import { EXPENSE_BREAKDOWN, SPENDING_TREND } from "@/lib/mock-data";

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

  const lowFactors = Object.entries(factors)
    .filter(([, v]) => v < 60)
    .map(([k]) => k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()));

  return {
    overall,
    factors,
    explanation: `Your Financial Health Score is ${overall}/100. ${overall >= 80 ? "Strong financial health." : overall >= 60 ? "Moderate — room for improvement." : "Needs attention."} Key areas to address: ${lowFactors.length > 0 ? lowFactors.join(", ") : "you're doing well across all factors."}`,
    recommendations: lowFactors.slice(0, 3).map(
      (f) => `Focus on improving ${f.toLowerCase()} — this is your weakest area.`
    ),
  };
}

function calculateFactors(): HealthScoreFactors {
  const totalSpending = EXPENSE_BREAKDOWN.reduce((s, c) => s + c.amount, 0);
  const monthlyIncome = 75000;
  const savings = monthlyIncome - totalSpending;
  const savingsRate = (savings / monthlyIncome) * 100;

  const recentMonths = SPENDING_TREND.slice(-3);
  const spendingValues = recentMonths.map((m) => m.spending);
  const spendingMean = spendingValues.reduce((a, b) => a + b, 0) / spendingValues.length;
  const spendingVariance = spendingValues.reduce((s, v) => s + Math.pow(v - spendingMean, 2), 0) / spendingValues.length;
  const stabilityScore = Math.max(0, 100 - spendingVariance / 500);

  return {
    savingsRate: Math.min(100, (savingsRate / 30) * 100),
    debtRatio: 82,
    emergencyFund: 70,
    expenseStability: Math.round(stabilityScore),
    budgetAdherence: 76,
    goalProgress: 72,
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
      trend: "up",
      change: 3,
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
              content: `You are a financial health analyst. Given a user's Financial Health Score of ${result.overall}/100 and factor breakdown, provide 3 specific, actionable recommendations in a JSON array: [{ "title": "...", "description": "..." }]`,
            },
            {
              role: "user",
              content: `Factors: ${JSON.stringify(factors)}. Current recommendations: ${result.recommendations.join(", ")}. Provide improved recommendations.`,
            },
          ],
          { temperature: 0.4, maxTokens: 512 }
        );

        try {
          const aiRecs = JSON.parse(aiInsight);
          result.recommendations = aiRecs.map((r: { title: string }) => r.title);
        } catch { /* use default recommendations */ }
      } catch { /* use default */ }
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: "Failed to calculate health score" }, { status: 500 });
  }
}
