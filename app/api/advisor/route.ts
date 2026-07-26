import { NextRequest, NextResponse } from "next/server";
import { isAIReal } from "@/lib/config";
import { chatWithAI, generateGuruDebate, type AIChatMessage } from "@/services/ai-client";
import { getRelevantGuruPassages } from "@/lib/guru-knowledge";
import { getFinancialAdvice } from "@/lib/financial-advice";
import { MOCK_TRANSACTIONS, EXPENSE_BREAKDOWN, MOCK_GOALS } from "@/lib/mock-data";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, mode } = body as { query: string; mode: "chat" | "debate" | "insight" };

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    if (mode === "debate" && isAIReal()) {
      const guruContexts = getRelevantGuruPassages(query);
      const totalSpending = EXPENSE_BREAKDOWN.reduce((s, c) => s + c.amount, 0);

      const debate = await generateGuruDebate({
        query,
        guruContexts: guruContexts
          .filter((g) => g.relevantPassages.length > 0)
          .map((g) => ({
            name: g.guru.name,
            philosophy: g.guru.philosophy,
            passages: g.relevantPassages,
          })),
        userContext: {
          monthlyIncome: 75000,
          monthlySpending: totalSpending,
          savingsRate: ((75000 - totalSpending) / 75000) * 100,
          recentTransactions: MOCK_TRANSACTIONS.map(
            (t) => `${t.merchant}: ₹${t.amount} (${t.category})`
          ).join(", "),
          goals: MOCK_GOALS.map((g) => `${g.title}: ₹${g.currentAmount}/₹${g.targetAmount}`).join(", "),
        },
      });

      return NextResponse.json(debate);
    }

    if (mode === "insight" && isAIReal()) {
      const totalSpending = EXPENSE_BREAKDOWN.reduce((s, c) => s + c.amount, 0);
      const systemPrompt = `You are a financial analyst. Analyze the following financial data and generate personalized insights.

Income: ₹75,000/month
Spending by category: ${EXPENSE_BREAKDOWN.map((c) => `${c.category}: ₹${c.amount}`).join(", ")}
Total spending: ₹${totalSpending}
Savings: ₹${75000 - totalSpending}
Savings rate: ${(((75000 - totalSpending) / 75000) * 100).toFixed(1)}%
Recent transactions: ${MOCK_TRANSACTIONS.slice(0, 5).map((t) => `${t.merchant} ₹${t.amount}`).join(", ")}

Provide concise, actionable insights in JSON array format: [{ "title": "string", "description": "string", "type": "spending|savings|subscription|pattern|anomaly", "severity": "info|warning|critical" }]`;

      const aiResponse = await chatWithAI(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate my financial insights for this month." },
        ],
        { temperature: 0.4, maxTokens: 1024 }
      );

      try {
        const insights = JSON.parse(aiResponse);
        return NextResponse.json({ insights, source: "ai" });
      } catch {
        return NextResponse.json({ insights: [], source: "ai", raw: aiResponse });
      }
    }

    const debate = getFinancialAdvice(query);
    const responses = debate.responses.map((r) => ({
      guruId: r.guru.id,
      guruName: r.guru.name,
      emoji: r.guru.emoji,
      philosophy: r.guru.philosophy,
      principle: r.principle.principle,
      advice: r.principle.advice,
    }));
    return NextResponse.json({ responses, summary: debate.summary, confidence: 70 });
  } catch (err) {
    console.error("Advisor API error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    provider: isAIReal() ? "live" : "mock",
    status: "operational",
  });
}
