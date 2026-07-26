import type {
  GuruResponse,
  GuruDebate,
  AIRecommendation,
  PredictionResult,
  AIInsight,
  AIAgentTool,
} from "@/types/finance";
import { FINANCIAL_GURUS, ADVICE_PRINCIPLES } from "@/lib/financial-advice";
import { MOCK_TRANSACTIONS, EXPENSE_BREAKDOWN, SPENDING_TREND } from "@/lib/mock-data";
import { isAIReal } from "@/lib/config";

async function apiCall<T>(endpoint: string, body: Record<string, unknown>): Promise<T | null> {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function matchGurus(query: string): GuruResponse[] {
  const normalized = query.toLowerCase();
  const matched = ADVICE_PRINCIPLES.filter((p) =>
    p.keywords.some((k) => normalized.includes(k))
  );
  const selected = matched.length > 0 ? matched : ADVICE_PRINCIPLES.slice(0, 3);
  const deduped = new Map<string, GuruResponse>();
  for (const p of selected) {
    const guru = FINANCIAL_GURUS.find((g) => g.id === p.guruId);
    if (guru && !deduped.has(guru.id)) {
      deduped.set(guru.id, {
        guruId: guru.id,
        guruName: guru.name,
        emoji: guru.emoji,
        philosophy: guru.philosophy,
        principle: p.principle,
        advice: p.advice,
      });
    }
  }
  return Array.from(deduped.values());
}

function generateSummary(query: string, responses: GuruResponse[]): string {
  const totalSpending = EXPENSE_BREAKDOWN.reduce((s, c) => s + c.amount, 0);
  const monthlyIncome = 75000;
  const savingsRate = ((monthlyIncome - totalSpending) / monthlyIncome) * 100;
  if (responses.length === 0) {
    return "Based on your financial profile, consider reviewing your spending categories and setting clear savings goals before making this decision.";
  }
  return `Considering your monthly income of ₹${(monthlyIncome / 1000).toFixed(0)}K and current savings rate of ${savingsRate.toFixed(0)}%, the most prudent path aligns with ${responses[0]?.guruName || "sound financial principles"}. Your current spending across all categories totals ₹${(totalSpending / 1000).toFixed(0)}K/month.`;
}

export async function getGuruDebate(query: string): Promise<GuruDebate> {
  if (isAIReal()) {
    const result = await apiCall<{ responses: GuruResponse[]; summary: string; confidence: number }>(
      "/api/advisor", { query, mode: "debate" }
    );
    if (result) {
      return { query, responses: result.responses, summary: result.summary, confidence: result.confidence };
    }
  }
  const responses = matchGurus(query);
  const summary = generateSummary(query, responses);
  const confidence = Math.min(95, 60 + responses.length * 10);
  return { query, responses, summary, confidence };
}

export function detectTools(query: string): AIAgentTool[] {
  const q = query.toLowerCase();
  const tools: AIAgentTool[] = [];
  if (q.includes("spent") || q.includes("expense") || q.includes("spend") || q.includes("transaction")) {
    tools.push("transaction-search");
    tools.push("expense-extraction");
  }
  if (q.includes("budget") || q.includes("overspend") || q.includes("limit")) {
    tools.push("budget-planner");
  }
  if (q.includes("save") || q.includes("savings") || q.includes("emergency fund")) {
    tools.push("savings-planner");
  }
  if (q.includes("goal") || q.includes("target") || q.includes("track")) {
    tools.push("goal-tracker");
  }
  if (q.includes("health") || q.includes("score") || q.includes("rating")) {
    tools.push("health-score");
  }
  if (q.includes("invest") || q.includes("sip") || q.includes("stock") || q.includes("mutual")) {
    tools.push("investment-advisor");
  }
  if (q.includes("predict") || q.includes("future") || q.includes("next month")) {
    tools.push("future-prediction");
  }
  if (q.includes("book") || q.includes("guru") || q.includes("buffett") || q.includes("kiyosaki") || q.includes("sethi")) {
    tools.push("book-search");
  }
  if (q.includes("splitwise") || q.includes("friend") || q.includes("owe")) {
    tools.push("splitwise-search");
  }
  if (tools.length === 0) tools.push("financial-advisor");
  return [...new Set(tools)];
}

export function getAIRecommendations(): AIRecommendation[] {
  const monthlyIncome = 75000;
  const totalSpending = EXPENSE_BREAKDOWN.reduce((s, c) => s + c.amount, 0);
  return [
    {
      id: "rec-1",
      title: "Increase monthly SIP by ₹2,000",
      description: "Your current savings rate allows room for an additional ₹2,000/month in an index fund.",
      category: "investment",
      impact: "high",
      potentialSavings: 24000,
      reasoning: "Based on your income of ₹75K and current spending, reallocating 2.6% of income to investments would build long-term wealth.",
      sourceBook: "The Warren Buffett Way",
      sourceAuthor: "Robert Hagstrom",
      confidence: 88,
    },
    {
      id: "rec-2",
      title: "Reduce dining out by ₹2,500/month",
      description: "Your food category is 18% above average. A weekly cap would recover significant spend.",
      category: "spending",
      impact: "high",
      potentialSavings: 30000,
      reasoning: "Dining out is your fastest-growing expense category. Trimming it aligns with your emergency fund goal.",
      sourceBook: "I Will Teach You To Be Rich",
      sourceAuthor: "Ramit Sethi",
      confidence: 92,
    },
    {
      id: "rec-3",
      title: "Cancel unused subscription services",
      description: "You have 3 subscriptions totaling ₹1,847/month that you rarely use.",
      category: "subscription",
      impact: "medium",
      potentialSavings: 22164,
      reasoning: "Subscription creep is reducing your savings rate by 2.5%. A quarterly audit prevents unnecessary bleed.",
      confidence: 85,
    },
    {
      id: "rec-4",
      title: "Increase emergency fund contribution",
      description: "You're at 70% of your target. Accelerating contributions gets you there 2 months early.",
      category: "savings",
      impact: "medium",
      potentialSavings: 0,
      reasoning: "A fully-funded emergency fund is the foundation of financial stability per Dave Ramsey's Baby Steps.",
      sourceBook: "The Total Money Makeover",
      sourceAuthor: "Dave Ramsey",
      confidence: 90,
    },
    {
      id: "rec-5",
      title: "Delay the next large purchase by 2 months",
      description: "Waiting will keep you above your 20% savings target without stress.",
      category: "budget",
      impact: "low",
      potentialSavings: 0,
      reasoning: "Your current cash flow supports this delay comfortably. Patience prevents lifestyle inflation.",
      sourceBook: "The Psychology of Money",
      sourceAuthor: "Morgan Housel",
      confidence: 78,
    },
  ];
}

export function getPredictions(): PredictionResult[] {
  const totalSpending = EXPENSE_BREAKDOWN.reduce((s, c) => s + c.amount, 0);
  const monthlyIncome = 75000;
  const currentSavings = monthlyIncome - totalSpending;
  return [
    {
      month: "Aug 2026",
      predictedExpenses: totalSpending + 1200,
      predictedSavings: currentSavings - 1200,
      confidence: 85,
      cashFlow: monthlyIncome - totalSpending - 1200,
      budgetOverflow: false,
      goalCompletionPercent: 72,
    },
    {
      month: "Sep 2026",
      predictedExpenses: totalSpending + 800,
      predictedSavings: currentSavings - 800,
      confidence: 72,
      cashFlow: monthlyIncome - totalSpending - 800,
      budgetOverflow: false,
      goalCompletionPercent: 75,
    },
    {
      month: "Oct 2026",
      predictedExpenses: totalSpending + 3500,
      predictedSavings: currentSavings - 3500,
      confidence: 60,
      cashFlow: monthlyIncome - totalSpending - 3500,
      budgetOverflow: true,
      goalCompletionPercent: 78,
    },
  ];
}

export async function getSpendingInsights(): Promise<AIInsight[]> {
  if (isAIReal()) {
    const result = await apiCall<{ insights: AIInsight[] }>("/api/insights", {});
    if (result?.insights) return result.insights;
  }
  return [
    {
      id: "insight-1",
      title: "Food spending is up 18% this month",
      description: "You spent ₹9,600 on food vs. your monthly average of ₹8,140. The increase is driven by weekend dining out.",
      metric: { value: "18%", direction: "up", positive: false },
      type: "spending",
      severity: "warning",
    },
    {
      id: "insight-2",
      title: "Transportation costs decreased 24%",
      description: "Work-from-home days increased this month, saving ₹1,300 in commute costs.",
      metric: { value: "24%", direction: "down", positive: true },
      type: "spending",
      severity: "info",
    },
    {
      id: "insight-3",
      title: "Subscription services consuming ₹1,847/month",
      description: "Netflix, Spotify, and a cloud storage subscription are all active. Review for overlap.",
      metric: { value: "₹1,847/mo", direction: "up", positive: false },
      type: "subscription",
      severity: "warning",
    },
    {
      id: "insight-4",
      title: "Weekend shopping accounts for 38% of discretionary spend",
      description: "Most of your shopping happens on Saturday and Sunday afternoons — an impulse pattern.",
      type: "pattern",
      severity: "info",
    },
    {
      id: "insight-5",
      title: "Duplicate payment detected at Blue Tokai Coffee",
      description: "Two transactions of ₹480 each on the same day — one may be a duplicate.",
      type: "anomaly",
      severity: "critical",
    },
    {
      id: "insight-6",
      title: "Savings rate improved to 24%",
      description: "You're now saving ₹18,700/month — up from 22% last month. Consistent progress.",
      metric: { value: "24%", direction: "up", positive: true },
      type: "savings",
      severity: "info",
    },
  ];
}

export async function getMultiToolResponse(query: string): Promise<{
  tools: AIAgentTool[];
  guruDebate?: GuruDebate;
  summary: string;
}> {
  const tools = detectTools(query);
  const debate = await getGuruDebate(query);
  let summary = debate.summary;
  if (tools.includes("expense-extraction") || tools.includes("transaction-search")) {
    const recentTx = MOCK_TRANSACTIONS.slice(0, 3);
    summary += ` Your recent transactions include ${recentTx.map((t) => `${t.merchant} (₹${t.amount})`).join(", ")}.`;
  }
  if (tools.includes("budget-planner")) {
    const total = EXPENSE_BREAKDOWN.reduce((s, c) => s + c.amount, 0);
    summary += ` Your total monthly spending is ₹${(total / 1000).toFixed(0)}K.`;
  }
  return { tools, guruDebate: debate, summary };
}
