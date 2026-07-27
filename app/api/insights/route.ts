import { NextResponse } from "next/server";
import { isAIReal } from "@/lib/config";
import { chatWithAI } from "@/services/ai-client";
import { EXPENSE_BREAKDOWN, MOCK_TRANSACTIONS } from "@/lib/mock-data";
import {
  generateExpenseAnalysis,
  categoryInsights,
  detectAnomalies,
  totalSpending,
  savingsRate as calcSavingsRate,
  getMonthlyTransactions,
} from "@/lib/financial-engine";
import type { AIInsight, Transaction } from "@/types/finance";

export async function GET() {
  try {
    const transactions = (MOCK_TRANSACTIONS as Transaction[]).map((t) => ({
      ...t,
      date: t.date || new Date().toISOString().split("T")[0],
    }));
    const analysis = generateExpenseAnalysis(transactions);
    const currentTotal = totalSpending(getMonthlyTransactions(transactions, 1));
    const monthlyIncome = 75000;
    const rate = calcSavingsRate(monthlyIncome, currentTotal);
    const savings = monthlyIncome - currentTotal;

    if (isAIReal()) {
      const analysisText = analysis.filter((a) => a.currentMonth > 0).map(
        (a) => `${a.category}: ₹${a.currentMonth} (${a.changeVsAvg3 > 0 ? "+" : ""}${a.changeVsAvg3}% vs 3mo avg)`
      ).join(", ");

      const systemPrompt = `You are a financial data analyst. Generate 4-6 natural language insights from the user's financial data below. Every insight must reference actual numbers.

User Data:
- Monthly Income: ₹75,000
- Total Spending: ₹${currentTotal.toLocaleString()}
- Savings: ₹${savings.toLocaleString()} (${rate.toFixed(1)}%)
- Category Analysis: ${analysisText}
- Recent Transactions: ${MOCK_TRANSACTIONS.slice(0, 5).map((t) => `${t.merchant} (₹${t.amount}) - ${t.category}`).join(", ")}

Return JSON array: [{ "title": "string", "description": "string with specific numbers", "type": "spending|savings|subscription|pattern|anomaly", "severity": "info|warning|critical" }]

If insufficient data, return empty array.`;

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

    const computedInsights = categoryInsights(analysis);
    const anomalies = detectAnomalies(transactions);
    const allInsights = [...computedInsights, ...anomalies];

    if (allInsights.length === 0) {
      allInsights.push({
        id: "insight-1",
        title: `Food spending leads at ${((EXPENSE_BREAKDOWN.find(c => c.category === "food")?.amount || 0) / currentTotal * 100).toFixed(0)}% of total expenses`,
        description: `You spent ₹${(EXPENSE_BREAKDOWN.find(c => c.category === "food")?.amount || 0).toLocaleString()} on food this month.`,
        metric: { value: `${EXPENSE_BREAKDOWN.find(c => c.category === "food")?.amount || 0}`, direction: "up" as const, positive: false },
        type: "spending" as const,
        severity: "info" as const,
      });
      allInsights.push({
        id: "insight-2",
        title: `Savings rate is ${rate.toFixed(0)}%`,
        description: `You're saving ₹${savings.toLocaleString()} out of ₹75,000 monthly income.`,
        metric: { value: `${rate.toFixed(0)}%`, direction: "up" as const, positive: rate >= 20 },
        type: "savings" as const,
        severity: rate >= 20 ? "info" as const : "warning" as const,
      });
      allInsights.push({
        id: "insight-3",
        title: `${MOCK_TRANSACTIONS.length} transactions recorded this period`,
        description: `Your average transaction is ₹${(currentTotal / MOCK_TRANSACTIONS.length).toFixed(0)}.`,
        type: "pattern" as const,
        severity: "info" as const,
      });
    }

    return NextResponse.json({ insights: allInsights, source: "calculated", provider: "mock" });
  } catch (err) {
    console.error("Insights error:", err);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
