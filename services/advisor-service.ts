import type {
  GuruResponse,
  GuruDebate,
  AIRecommendation,
  PredictionResult,
  AIInsight,
  AIAgentTool,
  FinancialGoal,
  Transaction,
  ExpenseAnalysis,
} from "@/types/finance";
import { FINANCIAL_GURUS, ADVICE_PRINCIPLES } from "@/lib/financial-advice";
import { EXPENSE_BREAKDOWN, SPENDING_TREND } from "@/lib/mock-data";
import { isAIReal } from "@/lib/config";
import {
  getMonthlyTransactions,
  totalSpending,
  savingsRate,
  generateExpenseAnalysis,
  categoryInsights,
  detectAnomalies,
  generatePredictionsFromData,
  generateRecommendationsFromData,
  generateStructuredResponse,
  generateFollowUpQuestions,
  searchFinancialBooks,
  groupByCategory,
  categoryTotals,
  analyzeWeekendVsWeekday,
  analyzeMerchantFrequency,
  detectSpendingSpikes,
} from "@/lib/financial-engine";
import { getRelevantGuruPassages } from "@/lib/guru-knowledge";
import { useExpensesStore } from "@/store/expenses-store";

const DEFAULT_INCOME = 75000;

function getTransactions(): Transaction[] {
  if (typeof window === "undefined") return [];
  try {
    return useExpensesStore.getState().transactions || [];
  } catch {
    return [];
  }
}

function getGoals(): FinancialGoal[] {
  if (typeof window === "undefined") return [];
  try {
    const { useGoalsStore } = require("@/store/goals-store");
    return useGoalsStore.getState().goals || [];
  } catch {
    return [];
  }
}

function getIncome(): number {
  if (typeof window === "undefined") return DEFAULT_INCOME;
  try {
    const { usePersonaStore } = require("@/store/persona-store");
    const profile = usePersonaStore.getState().profile;
    return profile.monthlyIncome || DEFAULT_INCOME;
  } catch {
    return DEFAULT_INCOME;
  }
}

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

function matchGurus(query: string, analysis?: ExpenseAnalysis[]): GuruResponse[] {
  const normalized = query.toLowerCase();
  const matched = ADVICE_PRINCIPLES.filter((p) =>
    p.keywords.some((k) => normalized.includes(k))
  );
  const selected = matched.length > 0 ? matched : [
    ADVICE_PRINCIPLES[0], // Warren Buffett
    ADVICE_PRINCIPLES.find(p => p.guruId === "mashelkar")!,
    ADVICE_PRINCIPLES.find(p => p.guruId === "orman")!
  ];
  const deduped = new Map<string, GuruResponse>();

  const books = searchFinancialBooks(query);
  const bookContext = books.length > 0 ? `\n\nRelevant Financial Literature:\n${books.map((b) => `"${b.passage}" — ${b.source}`).join("\n")}` : "";

  for (const p of selected) {
    const guru = FINANCIAL_GURUS.find((g) => g.id === p.guruId);
    if (guru && !deduped.has(guru.id)) {
      let advice = p.advice;
      if (analysis && analysis.length > 0) {
        const relevantAlert = analysis.find((a) => {
          const catKeywords = [a.category, ...a.category.split("-")];
          return p.keywords.some((k) => catKeywords.some((ck) => k.includes(ck) || ck.includes(k)));
        });
        if (relevantAlert && relevantAlert.isAlert) {
          advice += ` For example, your ${relevantAlert.category} spending is ₹${relevantAlert.currentMonth.toLocaleString()} (${relevantAlert.changeVsAvg3 > 0 ? "+" : ""}${relevantAlert.changeVsAvg3}% vs average).`;
        }
      }
      deduped.set(guru.id, {
        guruId: guru.id,
        guruName: guru.name,
        emoji: guru.emoji,
        philosophy: guru.philosophy,
        principle: p.principle,
        advice: advice + bookContext,
      });
    }
  }
  return Array.from(deduped.values());
}

export async function getGuruDebate(query: string): Promise<GuruDebate> {
  const transactions = getTransactions();
  const analysis = generateExpenseAnalysis(transactions);
  const income = getIncome();
  const spending = totalSpending(getMonthlyTransactions(transactions, 1));
  const rate = savingsRate(income, spending);

  if (isAIReal()) {
    const result = await apiCall<{ responses: GuruResponse[]; summary: string; confidence: number }>(
      "/api/advisor", {
        query,
        mode: "debate",
        userContext: {
          transactions: transactions.slice(0, 20),
          income,
          analysis: analysis.filter((a) => a.currentMonth > 0),
        },
      }
    );
    if (result) {
      return { query, responses: result.responses, summary: result.summary, confidence: result.confidence };
    }
  }

  const responses = matchGurus(query, analysis);
  const summary = generateStructuredResponse(query, analysis, transactions, income, getGoals()).split("\n\n")[0];
  const confidence = Math.min(95, Math.round(60 + responses.length * 8 +
    (transactions.length >= 5 ? 8 : 0) +
    (analysis.filter((a) => a.currentMonth > 0).length >= 3 ? 5 : 0)));

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
  const transactions = getTransactions();
  const income = getIncome();
  const goals = getGoals();
  const analysis = generateExpenseAnalysis(transactions);
  return generateRecommendationsFromData(analysis, income, transactions, goals);
}

export function getPredictions(): PredictionResult[] {
  const transactions = getTransactions();
  const income = getIncome();
  return generatePredictionsFromData(transactions, income);
}

export async function getSpendingInsights(): Promise<AIInsight[]> {
  const transactions = getTransactions();
  const analysis = generateExpenseAnalysis(transactions);

  if (isAIReal()) {
    const result = await apiCall<{ insights: AIInsight[] }>("/api/insights", {
      transactions: transactions.slice(0, 30),
      analysis,
    });
    if (result?.insights) return result.insights;
  }

  const computedInsights = categoryInsights(analysis);
  const anomalies = detectAnomalies(transactions);
  const weekendInsights = analyzeWeekendVsWeekday(transactions).insights;
  const merchantInsights = analyzeMerchantFrequency(transactions).insights;
  const spikeInsights = detectSpendingSpikes(transactions);
  const allInsights = [...computedInsights, ...anomalies, ...weekendInsights, ...merchantInsights, ...spikeInsights];

  if (allInsights.length === 0) {
    const income = getIncome();
    const currentTotal = totalSpending(getMonthlyTransactions(transactions, 1));
    const rate = savingsRate(income, currentTotal);
    allInsights.push({
      id: `insight-base-${Date.now()}`,
      title: `Savings rate is ${rate.toFixed(0)}%`,
      description: `You're saving ₹${(income - currentTotal).toLocaleString()} out of ₹${income.toLocaleString()} monthly income.`,
      metric: { value: `${rate.toFixed(0)}%`, direction: rate >= 20 ? "up" : "down", positive: rate >= 20 },
      type: "savings",
      severity: rate >= 20 ? "info" : rate >= 10 ? "warning" : "critical",
    });
    allInsights.push({
      id: `insight-tx-${Date.now()}`,
      title: `${transactions.length} transactions recorded`,
      description: `Your average transaction is ₹${transactions.length > 0 ? Math.round(currentTotal / transactions.length).toLocaleString() : 0}.`,
      type: "pattern",
      severity: "info",
    });
  }

  return allInsights;
}

export async function getMultiToolResponse(query: string): Promise<{
  tools: AIAgentTool[];
  guruDebate?: GuruDebate;
  summary: string;
  structuredAdvice?: string;
  followUpQuestions?: { question: string; context: string }[];
  missingData?: string[];
}> {
  const tools = detectTools(query);
  const transactions = getTransactions();
  const income = getIncome();
  const goals = getGoals();
  const analysis = generateExpenseAnalysis(transactions);
  const books = searchFinancialBooks(query);

  const debate = await getGuruDebate(query);

  const structured = generateStructuredResponse(query, analysis, transactions, income, goals);
  const followUps = generateFollowUpQuestions(transactions, income, goals);

  const missingData: string[] = [];
  if (!income || income <= 0) missingData.push("monthly income");
  if (transactions.length < 3) missingData.push("recent transactions");
  if (goals.length === 0) missingData.push("financial goals");

  let summary = structured;
  if (books.length > 0) {
    summary += `\n\n**Book Knowledge Applied**\n${books.slice(0, 2).map((b) => `"${b.passage}" — ${b.source}`).join("\n")}`;
  }
  if (books.length === 0) {
    summary += `\n\n**No supporting financial literature found.**`;
  }

  if (missingData.length > 0) {
    summary += `\n\n**Missing Information**\nI currently don't have enough financial information to answer fully accurately. Please provide: ${missingData.join(", ")}.`;
  }

  if (transactions.length === 0) {
    summary = "I don't yet have enough spending history to recommend a monthly budget. Upload at least one month of expenses or connect your expense sources.";
  }

  return {
    tools,
    guruDebate: debate,
    summary,
    structuredAdvice: structured,
    followUpQuestions: followUps,
    missingData,
  };
}
