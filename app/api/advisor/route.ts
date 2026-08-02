import { NextRequest, NextResponse } from "next/server";
import { isAIReal } from "@/lib/config";
import { chatWithAI, generateGuruDebate, type AIChatMessage } from "@/services/ai-client";
import { getRelevantGuruPassages, GURU_KNOWLEDGE } from "@/lib/guru-knowledge";
import { getFinancialAdvice } from "@/lib/financial-advice";
import {
  generateExpenseAnalysis,
  searchFinancialBooks,
  totalSpending,
  savingsRate,
  generateStructuredResponse,
  generateFollowUpQuestions,
  categoryInsights,
  detectAnomalies,
  getMonthlyTransactions,
} from "@/lib/financial-engine";
import type { Transaction, ExpenseAnalysis, FinancialGoal, GuruResponse } from "@/types/finance";

const GURU_INDEX = new Map<string, Pick<GuruResponse, "guruId" | "guruName" | "emoji" | "philosophy">>();
for (const guru of GURU_KNOWLEDGE) {
  const key = guru.name.toLowerCase();
  const existing = GURU_INDEX.get(key);
  if (existing) {
    existing.emoji = existing.emoji || guru.emoji;
    existing.philosophy = existing.philosophy || guru.philosophy;
  } else {
    GURU_INDEX.set(key, {
      guruId: guru.name.toLowerCase().split(" ")[0],
      guruName: guru.name,
      emoji: guru.emoji,
      philosophy: guru.philosophy,
    });
  }
}

function normalizeDebateResponses(
  raw: { guruName: string; emoji: string; perspective: string; evidence: string }[]
): GuruResponse[] {
  return raw.map((r, i) => {
    const meta = GURU_INDEX.get(r.guruName.toLowerCase()) || {
      guruId: `guru-${i}`,
      guruName: r.guruName,
      emoji: r.emoji || "🤖",
      philosophy: "",
    };
    const evidence = r.evidence && r.evidence !== r.perspective ? `\n${r.evidence}` : "";
    return {
      guruId: meta.guruId,
      guruName: meta.guruName,
      emoji: meta.emoji,
      philosophy: meta.philosophy,
      principle: "AI Expert Principle",
      advice: `${r.perspective}${evidence}`,
    };
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, mode, userContext } = body as {
      query: string;
      mode: "chat" | "debate" | "insight";
      userContext?: {
        transactions?: Transaction[];
        income?: number;
        analysis?: ExpenseAnalysis[];
        goals?: FinancialGoal[];
      };
    };

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const transactions: Transaction[] = userContext?.transactions || [];
    const income = userContext?.income || 75000;
    const goals: FinancialGoal[] = userContext?.goals || [];
    const analysis = userContext?.analysis || generateExpenseAnalysis(transactions);
    const currentTotal = totalSpending(getMonthlyTransactions(transactions, 1));
    const rate = savingsRate(income, currentTotal);
    const books = searchFinancialBooks(query);

    if (mode === "debate" && isAIReal()) {
      const guruContexts = getRelevantGuruPassages(query);

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
          monthlyIncome: income,
          monthlySpending: currentTotal,
          savingsRate: rate,
          recentTransactions: transactions.slice(0, 10).map(
            (t: Transaction) => `${t.merchant}: ₹${t.amount} (${t.category})`
          ).join(", "),
          goals: goals.map((g: FinancialGoal) => `${g.title}: ₹${g.currentAmount}/₹${g.targetAmount}`).join(", "),
          expenseAnalysis: analysis.filter((a) => a.currentMonth > 0).map(
            (a) => `${a.category}: ₹${a.currentMonth} (${a.changeVsAvg3 > 0 ? "+" : ""}${a.changeVsAvg3}% vs 3mo avg, ${a.percentageOfTotal}% of total)`
          ).join("\n"),
          bookKnowledge: books.slice(0, 5).map((b) => `"${b.passage}" — ${b.source}`).join("\n"),
        },
      });

      return NextResponse.json({
        responses: normalizeDebateResponses(debate.responses),
        summary: debate.summary,
        confidence: debate.confidence,
      });
    }

    if (mode === "insight" && isAIReal()) {
      const analysisText = analysis.filter((a) => a.currentMonth > 0).map(
        (a) => `${a.category}: ₹${a.currentMonth} (${a.changeVsAvg3}% vs 3mo avg)`
      ).join(", ");

      const systemPrompt = `You are a financial data analyst. Analyze the user's actual financial data below and generate personalized, data-driven insights.

CRITICAL: Every insight must be based on the actual data provided. Do not invent values.

Income: ₹${income}/month
Total Spending: ₹${currentTotal}
Savings Rate: ${rate.toFixed(1)}%
Category Analysis: ${analysisText}
Recent Transactions: ${transactions.slice(0, 5).map((t: Transaction) => `${t.merchant} ₹${t.amount}`).join(", ")}

Return JSON array only: [{ "title": "string with specific numbers", "description": "string with calculations and comparisons", "type": "spending|savings|subscription|pattern|anomaly", "severity": "info|warning|critical" }]

If insufficient data exists, return: [{ "title": "Insufficient Data", "description": "Not enough transactions to generate meaningful insights. Please add more expense data.", "type": "pattern", "severity": "info" }]`;

      const aiResponse = await chatWithAI(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate my financial insights for this month using my actual data." },
        ],
        { temperature: 0.4, maxTokens: 1024 }
      );

      try {
        const insights = JSON.parse(aiResponse);
        return NextResponse.json({ responses: [], summary: "", confidence: 0, insights, source: "ai" });
      } catch {
        const computedInsights = [...categoryInsights(analysis), ...detectAnomalies(transactions)];
        return NextResponse.json({
          responses: [], summary: "", confidence: 0,
          insights: computedInsights.length > 0 ? computedInsights : [{
            id: "insight-fallback",
            title: `${transactions.length} transactions analyzed`,
            description: `Current savings rate: ${rate.toFixed(0)}%. Add more transactions for deeper insights.`,
            type: "pattern",
            severity: "info",
          }],
          source: "calculated",
        });
      }
    }

    const structured = generateStructuredResponse(query, analysis, transactions, income, goals);
    const followUps = generateFollowUpQuestions(transactions, income, goals);
    const booksResult = books.length > 0
      ? books.slice(0, 2).map((b) => `"${b.passage}" — ${b.source}`).join("\n")
      : "No supporting financial literature found.";

    const debate = getFinancialAdvice(query);
    const responses = debate.responses.map((r) => ({
      guruId: r.guru.id,
      guruName: r.guru.name,
      emoji: r.guru.emoji,
      philosophy: r.guru.philosophy,
      principle: r.principle.principle,
      advice: `${r.principle.advice}\n\n${booksResult}`,
    }));

    return NextResponse.json({
      responses,
      summary: structured,
      confidence: Math.round(Math.min(95, 60 + (analysis.filter((a) => a.isAlert).length * 5) + (transactions.length >= 5 ? 10 : 0))),
      followUpQuestions: followUps,
    });
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
