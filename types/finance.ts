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
