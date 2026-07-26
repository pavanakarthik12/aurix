import { NextRequest, NextResponse } from "next/server";
import { isAIReal } from "@/lib/config";
import { chatWithAI } from "@/services/ai-client";
import { EXPENSE_BREAKDOWN } from "@/lib/mock-data";

interface BudgetRecommendation {
  category: string;
  currentSpend: number;
  recommendedBudget: number;
  change: number;
  reasoning: string;
}

function generateBudgetRecs(): BudgetRecommendation[] {
  const totalSpending = EXPENSE_BREAKDOWN.reduce((s, c) => s + c.amount, 0);
  const monthlyIncome = 75000;
  const idealSavings = monthlyIncome * 0.2;
  const availableForExpenses = monthlyIncome - idealSavings;

  return EXPENSE_BREAKDOWN.map((cat) => {
    const currentRatio = cat.amount / totalSpending;
    const recommendedBudget = Math.round(availableForExpenses * currentRatio);
    const change = recommendedBudget - cat.amount;

    return {
      category: cat.category,
      currentSpend: cat.amount,
      recommendedBudget,
      change,
      reasoning: change >= 0
        ? `You're within budget. Room to increase by ₹${change}.`
        : `Reduce by ₹${Math.abs(change)} to align with the 20% savings goal.`,
    };
  });
}

export async function GET() {
  try {
    const recommendations = generateBudgetRecs();
    return NextResponse.json({ recommendations, updatedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ error: "Failed to calculate budgets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { income, fixedExpenses } = body as { income?: number; fixedExpenses?: number };

    const effectiveIncome = income || 75000;
    const recommendations = generateBudgetRecs();

    if (isAIReal()) {
      try {
        const aiSummary = await chatWithAI(
          [
            {
              role: "system",
              content: `You are a budget planning expert. Review these budget recommendations and provide a concise summary.`,
            },
            {
              role: "user",
              content: `Income: ₹${effectiveIncome}. Recommendations: ${JSON.stringify(recommendations)}. Provide a 2-3 sentence summary.`,
            },
          ],
          { temperature: 0.3, maxTokens: 256 }
        );

        return NextResponse.json({ recommendations, summary: aiSummary, source: "ai" });
      } catch {
        return NextResponse.json({ recommendations, source: "calculated" });
      }
    }

    return NextResponse.json({ recommendations, source: "calculated" });
  } catch (err) {
    return NextResponse.json({ error: "Failed to calculate budgets" }, { status: 500 });
  }
}
