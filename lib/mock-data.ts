import type { ExpenseCategory, FinancialGoal, Transaction } from "@/types/finance";

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: "t1", merchant: "Blue Tokai Coffee", category: "food", amount: 480, date: "2026-07-18" },
  { id: "t2", merchant: "Uber", category: "transport", amount: 320, date: "2026-07-18" },
  { id: "t3", merchant: "Amazon", category: "shopping", amount: 2450, date: "2026-07-17" },
  { id: "t4", merchant: "Netflix", category: "entertainment", amount: 649, date: "2026-07-16" },
  { id: "t5", merchant: "Apollo Pharmacy", category: "health", amount: 890, date: "2026-07-15" },
  { id: "t6", merchant: "BESCOM", category: "utilities", amount: 1740, date: "2026-07-14" },
];

export const MOCK_GOALS: FinancialGoal[] = [
  {
    id: "g1",
    title: "Emergency Fund",
    targetAmount: 300000,
    currentAmount: 210000,
    targetDate: "2026-12-31",
    type: "emergency-fund",
  },
  {
    id: "g2",
    title: "Goa Trip",
    targetAmount: 80000,
    currentAmount: 32000,
    targetDate: "2026-10-01",
    type: "travel",
  },
  {
    id: "g3",
    title: "Home Down Payment",
    targetAmount: 2000000,
    currentAmount: 540000,
    targetDate: "2028-06-01",
    type: "home-purchase",
  },
];

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food: "Food & Dining",
  transport: "Transport",
  entertainment: "Entertainment",
  utilities: "Utilities",
  shopping: "Shopping",
  health: "Health",
  housing: "Housing",
  other: "Other",
};

export const EXPENSE_BREAKDOWN: { category: ExpenseCategory; amount: number }[] = [
  { category: "housing", amount: 18000 },
  { category: "food", amount: 9600 },
  { category: "transport", amount: 4200 },
  { category: "shopping", amount: 7300 },
  { category: "utilities", amount: 3400 },
  { category: "entertainment", amount: 2100 },
  { category: "health", amount: 1900 },
  { category: "other", amount: 1400 },
];

export const SPENDING_TREND = [
  { month: "Feb", spending: 44200, savings: 15800 },
  { month: "Mar", spending: 47800, savings: 16400 },
  { month: "Apr", spending: 41500, savings: 19200 },
  { month: "May", spending: 49200, savings: 14100 },
  { month: "Jun", spending: 46100, savings: 17300 },
  { month: "Jul", spending: 47900, savings: 18700 },
];

export const QUICK_INSIGHTS = [
  {
    id: "i1",
    title: "Dining spend is up 22% this month",
    description: "You've spent ₹9,600 on food & dining — consider setting a weekly cap.",
  },
  {
    id: "i2",
    title: "You're ahead on your emergency fund",
    description: "At this pace, you'll reach your goal 2 months early.",
  },
  {
    id: "i3",
    title: "Subscription creep detected",
    description: "3 recurring subscriptions total ₹1,847/month — review for overlap.",
  },
];
