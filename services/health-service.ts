import type { FinancialHealthScore, TimelineEvent } from "@/types/finance";
import { EXPENSE_BREAKDOWN, SPENDING_TREND } from "@/lib/mock-data";

export function getFinancialHealthScore(): FinancialHealthScore {
  const totalSpending = EXPENSE_BREAKDOWN.reduce((s, c) => s + c.amount, 0);
  const monthlyIncome = 75000;
  const savings = monthlyIncome - totalSpending;
  const savingsRate = (savings / monthlyIncome) * 100;

  const savingsRateScore = Math.min(100, (savingsRate / 30) * 100);
  const debtRatioScore = 82;
  const emergencyFundScore = 70;
  const expenseStabilityScore = Math.round(Math.random() * 20 + 65);
  const budgetAdherenceScore = Math.round(Math.random() * 15 + 70);
  const goalProgressScore = 72;
  const incomeGrowthScore = 68;
  const investmentRatioScore = Math.round(Math.random() * 20 + 45);

  const overall = Math.round(
    (savingsRateScore * 0.2 +
      debtRatioScore * 0.15 +
      emergencyFundScore * 0.15 +
      expenseStabilityScore * 0.12 +
      budgetAdherenceScore * 0.12 +
      goalProgressScore * 0.1 +
      incomeGrowthScore * 0.08 +
      investmentRatioScore * 0.08)
  );

  const previousOverall = Math.round(overall - (Math.random() * 6 - 2));

  return {
    overall,
    savingsRate: Math.round(savingsRateScore),
    debtRatio: debtRatioScore,
    emergencyFund: emergencyFundScore,
    expenseStability: expenseStabilityScore,
    budgetAdherence: budgetAdherenceScore,
    goalProgress: goalProgressScore,
    incomeGrowth: incomeGrowthScore,
    investmentRatio: investmentRatioScore,
    trend: overall >= previousOverall ? "up" : "down",
    change: overall - previousOverall,
    explanation: `Your Financial Health Score of ${overall}/100 reflects disciplined savings (${Math.round(savingsRate)}% rate) and strong budget adherence. The primary area for improvement is investment allocation — you're currently investing ${investmentRatioScore < 60 ? "below" : "at"} the recommended ratio for your income bracket.`,
    recommendations: [
      "Increase your investment allocation to at least 20% of income",
      `Your emergency fund is at ${emergencyFundScore}% — consider accelerating contributions`,
      "Review subscription services for potential savings of ₹1,500+/month",
    ],
  };
}

export function getTimelineEvents(): TimelineEvent[] {
  return [
    {
      id: "evt-1",
      type: "expense",
      title: "Blue Tokai Coffee",
      amount: 480,
      date: "2026-07-18",
      category: "food",
      status: "completed",
    },
    {
      id: "evt-2",
      type: "expense",
      title: "Uber Ride",
      amount: 320,
      date: "2026-07-18",
      category: "transport",
      status: "completed",
    },
    {
      id: "evt-3",
      type: "savings",
      title: "Monthly SIP Contribution",
      amount: 5000,
      date: "2026-07-15",
      status: "completed",
      description: "Auto-invested in index fund",
    },
    {
      id: "evt-4",
      type: "goal",
      title: "Emergency Fund Progress",
      amount: 210000,
      date: "2026-07-15",
      status: "completed",
      description: "70% of ₹3,00,000 target reached",
    },
    {
      id: "evt-5",
      type: "bill",
      title: "Rent Payment",
      amount: 18000,
      date: "2026-07-05",
      status: "completed",
    },
    {
      id: "evt-6",
      type: "purchase",
      title: "Amazon Shopping",
      amount: 2450,
      date: "2026-07-17",
      category: "shopping",
      status: "completed",
    },
    {
      id: "evt-7",
      type: "payment",
      title: "Credit Card Bill Due",
      amount: 12400,
      date: "2026-08-05",
      status: "upcoming",
      description: "Full payment recommended to avoid interest",
    },
    {
      id: "evt-8",
      type: "bill",
      title: "Electricity Bill Due",
      amount: 1740,
      date: "2026-08-10",
      category: "utilities",
      status: "upcoming",
    },
    {
      id: "evt-9",
      type: "investment",
      title: "SIP Contribution",
      amount: 5000,
      date: "2026-08-15",
      status: "upcoming",
      description: "Monthly index fund investment",
    },
    {
      id: "evt-10",
      type: "goal",
      title: "Goa Trip Fund Milestone",
      amount: 48000,
      date: "2026-09-01",
      status: "upcoming",
      description: "Target: ₹80,000 — estimated 60% by this date",
    },
  ];
}
