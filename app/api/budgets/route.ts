import { NextRequest, NextResponse } from "next/server";
import { isAIReal } from "@/lib/config";
import { chatWithAI } from "@/services/ai-client";
type BudgetRecommendation = {
  category: string;
  currentSpend: number;
  recommendedBudget: number;
  change: number;
  reasoning: string;
};

export async function GET() {
  try {
    return NextResponse.json({ recommendations: [], updatedAt: new Date().toISOString(), source: "insufficient-budget-data" });
  } catch (err) {
    return NextResponse.json({ error: "Failed to calculate budgets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { income, fixedExpenses } = body as { income?: number; fixedExpenses?: number };

    if (!income || income <= 0 || !fixedExpenses || fixedExpenses < 0) {
      return NextResponse.json({ recommendations: [], source: "insufficient-data" });
    }

    const availableForExpenses = Math.max(0, income - fixedExpenses);
    const recommendations: BudgetRecommendation[] = [
      {
        category: "fixed-expenses",
        currentSpend: fixedExpenses,
        recommendedBudget: availableForExpenses,
        change: availableForExpenses - fixedExpenses,
        reasoning: "Budget based on the income and fixed-expense values you provided.",
      },
    ];

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
              content: `Income: ₹${income}. Fixed expenses: ₹${fixedExpenses}. Recommendations: ${JSON.stringify(recommendations)}. Provide a 2-3 sentence summary.`,
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
