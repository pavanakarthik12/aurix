export type RiskAppetite = "conservative" | "moderate" | "aggressive";

export type FinancialGoalType =
  | "emergency-fund"
  | "debt-payoff"
  | "wealth-growth"
  | "home-purchase"
  | "retirement"
  | "travel";

export interface OnboardingProfile {
  name: string;
  age: number | null;
  occupation: string;
  monthlyIncome: number | null;
  financialGoal: FinancialGoalType | null;
  riskAppetite: RiskAppetite | null;
  monthlySavings: number | null;
  preferredCurrency: string;
}

export interface FinancialPersona {
  title: string;
  archetype: string;
  riskLabel: string;
  traits: string[];
  summary: string;
}

export type ExpenseCategory =
  | "food"
  | "transport"
  | "entertainment"
  | "utilities"
  | "shopping"
  | "health"
  | "housing"
  | "other";

export interface Transaction {
  id: string;
  merchant: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  note?: string;
}

export interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  type: FinancialGoalType;
}

export type AIAgentTool =
  | "expense-extraction"
  | "budget-planner"
  | "financial-advisor"
  | "goal-tracker"
  | "health-score"
  | "book-search"
  | "transaction-search"
  | "splitwise-search"
  | "investment-advisor"
  | "savings-planner"
  | "future-prediction";

export interface GuruResponse {
  guruId: string;
  guruName: string;
  emoji: string;
  philosophy: string;
  principle: string;
  advice: string;
}

export interface GuruDebate {
  query: string;
  responses: GuruResponse[];
  summary: string;
  confidence: number;
}

export interface FinancialHealthScore {
  overall: number;
  savingsRate: number;
  debtRatio: number;
  emergencyFund: number;
  expenseStability: number;
  budgetAdherence: number;
  goalProgress: number;
  incomeGrowth: number;
  investmentRatio: number;
  trend: "up" | "down" | "stable";
  change: number;
  explanation: string;
  recommendations: string[];
}

export interface RAGDocument {
  id: string;
  title: string;
  type: "pdf" | "docx" | "txt" | "article";
  source: string;
  uploadedAt: string;
  chunkCount: number;
  status: "processing" | "ready" | "error";
}

export interface RAGSearchResult {
  documentId: string;
  documentTitle: string;
  chunk: string;
  pageNumber?: number;
  confidence: number;
  source: string;
}

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  category: "savings" | "spending" | "investment" | "debt" | "budget" | "subscription";
  impact: "high" | "medium" | "low";
  potentialSavings: number;
  reasoning: string;
  sourceBook?: string;
  sourceAuthor?: string;
  confidence: number;
  evidence?: FinancialCalculation[];
  whyItMatters?: string;
  expectedResult?: string;
  annualSavings?: number;
}

export interface TimelineEvent {
  id: string;
  type: "expense" | "savings" | "goal" | "investment" | "bill" | "purchase" | "payment";
  title: string;
  amount: number;
  date: string;
  category?: string;
  status?: "completed" | "upcoming" | "overdue";
  description?: string;
}

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  metric?: { value: string; direction: "up" | "down"; positive: boolean };
  type: "spending" | "savings" | "subscription" | "pattern" | "anomaly";
  severity: "info" | "warning" | "critical";
}

export interface PredictionResult {
  month: string;
  predictedExpenses: number;
  predictedSavings: number;
  confidence: number;
  cashFlow: number;
  budgetOverflow: boolean;
  goalCompletionPercent: number;
}

export interface FinancialCalculation {
  label: string;
  currentValue: string;
  previousValue?: string;
  benchmark?: string;
  difference: string;
  direction: "up" | "down" | "neutral";
  positive: boolean;
}

export interface AdviceEvidence {
  calculation: FinancialCalculation[];
  comparisonPeriod: "current-month" | "3-month" | "6-month" | "previous-month";
  sourceData: string[];
}

export interface StructuredAdvice {
  situation: string;
  evidence: AdviceEvidence;
  whyItMatters: string;
  recommendation: string;
  expectedResult: {
    description: string;
    annualSavings?: number;
    timeline?: string;
  };
  confidence: {
    score: number;
    reasoning: string;
  };
}

export interface FollowUpQuestion {
  question: string;
  context: string;
  required: boolean;
}

export interface ExpenseAnalysis {
  category: string;
  currentMonth: number;
  average3Month: number;
  average6Month: number;
  previousMonth: number;
  changeVsAvg3: number;
  changeVsAvg6: number;
  changeVsPrevious: number;
  percentageOfTotal: number;
  trend: "increasing" | "decreasing" | "stable";
  isAlert: boolean;
}
