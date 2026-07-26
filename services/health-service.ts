import type { FinancialHealthScore, TimelineEvent } from "@/types/finance";
import { EXPENSE_BREAKDOWN } from "@/lib/mock-data";

function calculateHealthScoreLocal(): FinancialHealthScore {
  const totalSpending = EXPENSE_BREAKDOWN.reduce((s, c) => s + c.amount, 0);
  const monthlyIncome = 75000;
  const savings = monthlyIncome - totalSpending;
  const savingsRate = (savings / monthlyIncome) * 100;

  const savingsRateScore = Math.min(100, (savingsRate / 30) * 100);
  const emergencyFundScore = 70;
  const budgetAdherenceScore = 76;
  const goalProgressScore = 72;

  const overall = Math.round(
    savingsRateScore * 0.2 +
    82 * 0.15 +
    emergencyFundScore * 0.15 +
    70 * 0.12 +
    budgetAdherenceScore * 0.12 +
    goalProgressScore * 0.1 +
    68 * 0.08 +
    52 * 0.08
  );

  return {
    overall,
    savingsRate: Math.round(savingsRateScore),
    debtRatio: 82,
    emergencyFund: emergencyFundScore,
    expenseStability: 70,
    budgetAdherence: budgetAdherenceScore,
    goalProgress: goalProgressScore,
    incomeGrowth: 68,
    investmentRatio: 52,
    trend: "up",
    change: 3,
    explanation: `Your Financial Health Score of ${overall}/100 reflects disciplined savings (${Math.round(savingsRate)}% rate) and strong budget adherence. The primary area for improvement is investment allocation.`,
    recommendations: [
      "Increase your investment allocation to at least 20% of income",
      "Consider accelerating emergency fund contributions",
      "Review subscription services for potential savings",
    ],
  };
}

export async function getFinancialHealthScore(): Promise<FinancialHealthScore> {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/health-score");
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch { /* fall through to local calculation */ }
  }
  return calculateHealthScoreLocal();
}

export function getTimelineEvents(): TimelineEvent[] {
  return [
    {
      id: "evt-1", type: "expense", title: "Blue Tokai Coffee", amount: 480,
      date: "2026-07-18", category: "food", status: "completed",
    },
    {
      id: "evt-2", type: "expense", title: "Uber Ride", amount: 320,
      date: "2026-07-18", category: "transport", status: "completed",
    },
    {
      id: "evt-3", type: "savings", title: "Monthly SIP Contribution", amount: 5000,
      date: "2026-07-15", status: "completed", description: "Auto-invested in index fund",
    },
    {
      id: "evt-4", type: "goal", title: "Emergency Fund Progress", amount: 210000,
      date: "2026-07-15", status: "completed", description: "70% of ₹3,00,000 target reached",
    },
    {
      id: "evt-5", type: "bill", title: "Rent Payment", amount: 18000,
      date: "2026-07-05", status: "completed",
    },
    {
      id: "evt-6", type: "purchase", title: "Amazon Shopping", amount: 2450,
      date: "2026-07-17", category: "shopping", status: "completed",
    },
    {
      id: "evt-7", type: "payment", title: "Credit Card Bill Due", amount: 12400,
      date: "2026-08-05", status: "upcoming", description: "Full payment recommended to avoid interest",
    },
    {
      id: "evt-8", type: "bill", title: "Electricity Bill Due", amount: 1740,
      date: "2026-08-10", category: "utilities", status: "upcoming",
    },
    {
      id: "evt-9", type: "investment", title: "SIP Contribution", amount: 5000,
      date: "2026-08-15", status: "upcoming", description: "Monthly index fund investment",
    },
    {
      id: "evt-10", type: "goal", title: "Goa Trip Fund Milestone", amount: 48000,
      date: "2026-09-01", status: "upcoming", description: "Target: ₹80,000 — estimated 60%",
    },
  ];
}
