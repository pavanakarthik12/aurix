export interface WhatIfScenario {
  id: string;
  label: string;
  short: string;
  description: string;
  /** Signed monthly change to available cash. Positive = frees up cash (saves), negative = spends more. */
  monthly: number;
  /** Signed one-time change applied to the invested corpus at t=0. Positive = windfall. */
  oneTime?: number;
}

export interface ProjectionPoint {
  /** 1-based timeline month index (0 = today) */
  month: number;
  label: string;
  /** Total contributed principal to date */
  invested: number;
  /** Future value of investments after compounding */
  value: number;
  /** Net worth used for charts (== value) */
  netWorth: number;
  /** Monthly cash available at this step (income - spending + scenario deltas) */
  cashFlow: number;
}

export interface ProjectionOptions {
  monthlyIncome: number;
  monthlySpending: number;
  /** Expected annual return, e.g. 0.12 for 12% */
  annualReturn?: number;
  /** Number of months to project from today */
  horizonMonths: number;
  /** Current invested corpus */
  startInvested?: number;
  scenarios?: WhatIfScenario[];
}

export function projectMonthlyCashFlow(opts: ProjectionOptions): number {
  const scenarioMonthly = (opts.scenarios || []).reduce((sum, s) => sum + s.monthly, 0);
  return opts.monthlyIncome - opts.monthlySpending + scenarioMonthly;
}

function shortMonthLabel(date: Date): string {
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

/**
 * Projects financial future month by month: each month's cash flow is added to
 * the invested corpus and the whole corpus compounds at the annual return.
 * Matches the compounding convention used by the same codebase's SIP engine.
 */
export function projectFinancialFuture(opts: ProjectionOptions): ProjectionPoint[] {
  const annualReturn = opts.annualReturn ?? 0.12;
  const monthlyRate = Math.pow(1 + annualReturn, 1 / 12) - 1;
  const oneTime = (opts.scenarios || []).reduce((sum, s) => sum + (s.oneTime ?? 0), 0);
  const monthlyCash = projectMonthlyCashFlow(opts);

  const now = new Date();
  const points: ProjectionPoint[] = [];
  points.push({
    month: 0,
    label: "Today",
    invested: Math.round((opts.startInvested || 0) + oneTime),
    value: Math.round(Math.max(0, (opts.startInvested || 0) + oneTime)),
    netWorth: Math.round(Math.max(0, (opts.startInvested || 0) + oneTime)),
    cashFlow: Math.round(monthlyCash),
  });

  let invested = (opts.startInvested || 0) + oneTime;
  let value = invested;

  for (let m = 1; m <= opts.horizonMonths; m++) {
    invested += monthlyCash;
    value = (value + monthlyCash) * (1 + monthlyRate);
    if (value < 0) value = 0;
    if (invested < 0) invested = 0;

    const date = new Date(now.getFullYear(), now.getMonth() + m, 1);
    points.push({
      month: m,
      label: shortMonthLabel(date),
      invested: Math.round(invested),
      value: Math.round(value),
      netWorth: Math.round(value),
      cashFlow: Math.round(monthlyCash),
    });
  }

  return points;
}

export const DEFAULT_SCENARIOS: WhatIfScenario[] = [
  {
    id: "cancel-streaming",
    label: "Cancel streaming (Netflix/Prime/Hotstar)",
    short: "Cancel streaming",
    description: "Drop to a single ₹199 plan + your home internet. Frees up ~₹649/month.",
    monthly: 649,
  },
  {
    id: "reduce-food-delivery",
    label: "Cut food delivery by ₹2,500/month",
    short: "Cut food delivery",
    description: "Cooking 2 extra meals a week and skipping one Swiggy/Zomato order.",
    monthly: 2500,
  },
  {
    id: "reduce-food-20",
    label: "Reduce food & dining spending by 20%",
    short: "20% less on dining",
    description: "Scales down grocery + restaurant runs with smarter weekly planning.",
    monthly: 2400,
  },
  {
    id: "increase-sip",
    label: "Increase SIP by ₹2,000/month",
    short: "+₹2,000 SIP",
    description: "Auto-debit ₹2,000 extra into an index fund each payday.",
    monthly: 2000,
  },
  {
    id: "buy-bike",
    label: "Buy a Honda Activa (₹80,000 on EMI)",
    short: "Buy a bike",
    description: "One-time ₹80,000 outflow + ₹1,500/month EMI & fuel.",
    oneTime: -80000,
    monthly: -1500,
  },
  {
    id: "annual-bonus",
    label: "Invest a ₹50,000 bonus (one-time)",
    short: "Invest ₹50,000 bonus",
    description: "Lump-sum a bonus into a Flexi-cap fund instead of spending it.",
    oneTime: 50000,
    monthly: 0,
  },
];