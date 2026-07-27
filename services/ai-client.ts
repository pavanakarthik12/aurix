import { config, isAIReal } from "@/lib/config";

export interface AIChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIChatOptions {
  temperature?: number;
  maxTokens?: number;
}

export async function chatWithAI(
  messages: AIChatMessage[],
  options: AIChatOptions = {}
): Promise<string> {
  if (!isAIReal()) {
    throw new Error("AI backend not configured. Set NEXT_PUBLIC_AI_PROVIDER=backend and run the FastAPI backend.");
  }

  const res = await fetch(`${config.app.apiUrl}/api/v1/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI backend error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.content || "";
}

export async function generateGuruDebate(request: {
  query: string;
  guruContexts: { name: string; philosophy: string; passages: string[] }[];
  userContext: {
    monthlyIncome: number;
    monthlySpending: number;
    savingsRate: number;
    recentTransactions: string;
    goals: string;
    expenseAnalysis?: string;
    bookKnowledge?: string;
  };
}): Promise<{
  responses: { guruName: string; emoji: string; perspective: string; evidence: string }[];
  summary: string;
  confidence: number;
}> {
  const analysisSection = request.userContext.expenseAnalysis
    ? `\nCategory Analysis:\n${request.userContext.expenseAnalysis}`
    : "";

  const booksSection = request.userContext.bookKnowledge
    ? `\n\nRelevant Financial Book Passages:\n${request.userContext.bookKnowledge}`
    : "\n\nNo supporting financial literature found. Generate advice based on financial data and reasoning only.";

  const systemPrompt = `You are an expert Certified Financial Planner (CFP). Analyze the user's question using their actual financial data and retrieved financial knowledge.

CRITICAL: Never give generic advice. Every recommendation must be specific, data-driven, and actionable.

Expert Knowledge:
${request.guruContexts.map((g) => `Guru: ${g.name}\nPhilosophy: ${g.philosophy}\nPassages: ${g.passages.map((p) => `"${p}"`).join(", ")}`).join("\n\n")}${booksSection}

User Financial Context:
- Monthly Income: ₹${request.userContext.monthlyIncome.toLocaleString()}
- Monthly Spending: ₹${request.userContext.monthlySpending.toLocaleString()}
- Savings Rate: ${request.userContext.savingsRate.toFixed(1)}%
- Recent Transactions: ${request.userContext.recentTransactions}
- Goals: ${request.userContext.goals}${analysisSection}

Response Structure (follow exactly):
1. Current Situation: Explain what the data shows
2. Evidence: Show specific calculations and comparisons
3. Why It Matters: Explain the financial impact
4. Recommendation: Give a concrete, actionable step
5. Expected Result: Estimate the savings or benefit
6. Confidence Score: Rate 0-100% with reasoning

Respond in JSON format only:
{
  "responses": [
    { "guruName": "...", "emoji": "...", "perspective": "Current Situation + Evidence + Why It Matters", "evidence": "specific calculations and data" }
  ],
  "summary": "Complete 6-part structured response",
  "confidence": 85
}`;

  const result = await chatWithAI(
    [{ role: "system", content: systemPrompt }, { role: "user", content: request.query }],
    { temperature: 0.4, maxTokens: 2048 }
  );

  try {
    return JSON.parse(result);
  } catch {
    return {
      responses: [
        {
          guruName: "AI Financial Advisor",
          emoji: "🤖",
          perspective: `Based on analysis of your financial data: Income ₹${request.userContext.monthlyIncome.toLocaleString()}/mo, Spending ₹${request.userContext.monthlySpending.toLocaleString()}/mo, Savings Rate ${request.userContext.savingsRate.toFixed(1)}%.`,
          evidence: request.userContext.recentTransactions.slice(0, 300),
        },
      ],
      summary: result.slice(0, 500),
      confidence: 70,
    };
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch(`${config.app.apiUrl}/api/v1/ai/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) throw new Error(`Embedding error: ${await res.text()}`);
  const data = await res.json();
  return data.embedding || [];
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return magA && magB ? dot / (magA * magB) : 0;
}

export async function processReceiptOCR(request: {
  base64Image: string;
  mimeType: string;
}): Promise<{
  merchant: string;
  amount: number;
  date: string;
  currency: string;
  tax?: number;
  paymentMethod?: string;
  referenceNumber?: string;
  category: string;
  subcategory?: string;
  confidence: number;
  rawText: string;
}> {
  const res = await fetch(`${config.app.apiUrl}/api/v1/ocr/receipt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) throw new Error(`OCR error: ${await res.text()}`);
  return await res.json();
}
