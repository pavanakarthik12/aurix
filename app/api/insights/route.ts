import { NextResponse } from "next/server";
import { isAIReal } from "@/lib/config";
import { chatWithAI } from "@/services/ai-client";
import { EXPENSE_BREAKDOWN, MOCK_TRANSACTIONS } from "@/lib/mock-data";

export async function GET() {
  try {
    const totalSpending = EXPENSE_BREAKDOWN.reduce((s, c) => s + c.amount, 0);
    const monthlyIncome = 75000;
    const savings = monthlyIncome - totalSpending;
    const savingsRate = ((savings / monthlyIncome) * 100).toFixed(1);

    if (isAIReal()) {
      const systemPrompt = `You are a financial data analyst. Generate 4-6 natural language insights from the user's financial data.

User Data:
- Monthly Income: ₹75,000
- Total Spending: ₹${totalSpending.toLocaleString()}
- Savings: ₹${savings.toLocaleString()} (${savingsRate}%)
- Category Breakdown: ${EXPENSE_BREAKDOWN.map((c) => `${c.category}: ₹${c.amount}`).join(", ")}
- Recent Transactions: ${MOCK_TRANSACTIONS.slice(0, 5).map((t) => `${t.merchant} (₹${t.amount}) - ${t.category}`).join(", ")}

Return JSON array: [{ "title": "string", "description": "string", "type": "spending|savings|subscription|pattern|anomaly", "severity": "info|warning|critical" }]`;

      const aiResponse = await chatWithAI(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: "What insights can you derive from my financial data?" },
        ],
        { temperature: 0.4, maxTokens: 1024 }
      );

      try {
        const insights = JSON.parse(aiResponse);
        return NextResponse.json({ insights, source: "ai", provider: "live" });
      } catch {
        return NextResponse.json({ insights: [], source: "ai-parse-error", raw: aiResponse });
      }
    }

    const insights = [
      {
        id: "insight-1",
        title: `Food spending leads at ${((EXPENSE_BREAKDOWN.find(c => c.category === "food")?.amount || 0) / totalSpending * 100).toFixed(0)}% of total expenses`,
        description: `You spent ₹${(EXPENSE_BREAKDOWN.find(c => c.category === "food")?.amount || 0).toLocaleString()} on food this month.`,
        metric: { value: `${EXPENSE_BREAKDOWN.find(c => c.category === "food")?.amount || 0}`, direction: "up" as const, positive: false },
        type: "spending" as const,
        severity: "info" as const,
      },
      {
        id: "insight-2",
        title: `Savings rate is ${savingsRate}%`,
        description: `You're saving ₹${savings.toLocaleString()} out of ₹75,000 monthly income.`,
        metric: { value: `${savingsRate}%`, direction: "up" as const, positive: true },
        type: "savings" as const,
        severity: "info" as const,
      },
      {
        id: "insight-3",
        title: `${MOCK_TRANSACTIONS.length} transactions recorded this period`,
        description: `Your average transaction is ₹${(MOCK_TRANSACTIONS.reduce((s, t) => s + t.amount, 0) / MOCK_TRANSACTIONS.length).toFixed(0)}.`,
        type: "pattern" as const,
        severity: "info" as const,
      },
    ];

    return NextResponse.json({ insights, source: "calculated", provider: "mock" });
  } catch (err) {
    console.error("Insights error:", err);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
