import { NextRequest, NextResponse } from "next/server";
import { isAIReal } from "@/lib/config";
import { chatWithAI } from "@/services/ai-client";
import { EXPENSE_BREAKDOWN } from "@/lib/mock-data";
import {
  generateExpenseAnalysis,
  categoryInsights,
  detectAnomalies,
  analyzeWeekendVsWeekday,
  analyzeMerchantFrequency,
  detectSpendingSpikes,
  totalSpending,
  savingsRate as calcSavingsRate,
  getMonthlyTransactions,
} from "@/lib/financial-engine";
import type { AIInsight, Transaction } from "@/types/finance";

export async function GET() {
  try {
    return NextResponse.json({
      status: "operational",
      message: "Use POST with transactions to get insights",
    });
  } catch (err) {
    console.error("Insights error:", err);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawTransactions = body.transactions as Transaction[] | undefined;
    const transactions: Transaction[] = (rawTransactions || []).map((t: Transaction) => ({
      ...t,
      date: t.date || new Date().toISOString().split("T")[0],
    }));

    const analysis = generateExpenseAnalysis(transactions);
    const currentTotal = totalSpending(getMonthlyTransactions(transactions, 1));
    const monthlyIncome = body.income || 75000;
    const rate = calcSavingsRate(monthlyIncome, currentTotal);
    const savings = monthlyIncome - currentTotal;

    if (isAIReal()) {
      const analysisText = analysis.filter((a) => a.currentMonth > 0).map(
        (a) => `${a.category}: ₹${a.currentMonth} (${a.changeVsAvg3 > 0 ? "+" : ""}${a.changeVsAvg3}% vs 3mo avg)`
      ).join(", ");

      const systemPrompt = `You are a financial data analyst. Generate 4-6 natural language insights from the user's financial data below. Every insight must reference actual numbers.

User Data:
- Monthly Income: ₹${monthlyIncome.toLocaleString()}
- Total Spending: ₹${currentTotal.toLocaleString()}
- Savings: ₹${savings.toLocaleString()} (${rate.toFixed(1)}%)
- Category Analysis: ${analysisText}
- Recent Transactions: ${transactions.slice(0, 5).map((t) => `${t.merchant} (₹${t.amount}) - ${t.category}`).join(", ")}

Return JSON array only: [{ "title": "string", "description": "string with specific numbers", "type": "spending|savings|subscription|pattern|anomaly", "severity": "info|warning|critical" }]

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

    const catInsights = categoryInsights(analysis);
    const anomalies = detectAnomalies(transactions);
    const weekendInsights = analyzeWeekendVsWeekday(transactions).insights;
    const merchantInsights = analyzeMerchantFrequency(transactions).insights;
    const spikeInsights = detectSpendingSpikes(transactions);

    const allInsights = [...catInsights, ...anomalies, ...weekendInsights, ...merchantInsights, ...spikeInsights];

    if (allInsights.length === 0 && transactions.length > 0) {
      allInsights.push({
        id: "insight-1",
        title: `Savings rate is ${rate.toFixed(0)}%`,
        description: `You're saving ₹${savings.toLocaleString()} out of ₹${monthlyIncome.toLocaleString()} monthly income.`,
        metric: { value: `${rate.toFixed(0)}%`, direction: "up" as const, positive: rate >= 20 },
        type: "savings" as const,
        severity: (rate >= 20 ? "info" : "warning") as "info" | "warning",
      });
      allInsights.push({
        id: "insight-2",
        title: `${transactions.length} transactions recorded`,
        description: `Your transactions total ₹${currentTotal.toLocaleString()}.`,
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
