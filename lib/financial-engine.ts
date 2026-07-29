import type { Transaction, ExpenseAnalysis, FinancialCalculation, AIRecommendation, PredictionResult, AIInsight, FinancialGoal } from "@/types/finance";
import { CATEGORY_LABELS } from "@/lib/mock-data";
import { GURU_KNOWLEDGE } from "@/lib/guru-knowledge";

export function getMonthlyTransactions(transactions: Transaction[], months: number = 1): Transaction[] {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  return transactions.filter((t) => new Date(t.date) >= cutoff);
}

export function groupByCategory(transactions: Transaction[]): Record<string, Transaction[]> {
  const groups: Record<string, Transaction[]> = {};
  for (const tx of transactions) {
    if (!groups[tx.category]) groups[tx.category] = [];
    groups[tx.category].push(tx);
  }
  return groups;
}

export function categoryTotals(transactions: Transaction[]): Record<string, number> {
  const groups = groupByCategory(transactions);
  const totals: Record<string, number> = {};
  for (const [cat, txs] of Object.entries(groups)) {
    totals[cat] = txs.reduce((s, t) => s + t.amount, 0);
  }
  return totals;
}

export function totalSpending(transactions: Transaction[]): number {
  return transactions.reduce((s, t) => s + t.amount, 0);
}

export function savingsRate(income: number, spending: number): number {
  if (income <= 0) return 0;
  return ((income - spending) / income) * 100;
}

export function computeMonthlyAverages(transactions: Transaction[]): Record<string, { current: number; avg3: number; avg6: number; prev: number }> {
  const currentMonth = getMonthlyTransactions(transactions, 1);
  const prevMonth = getMonthlyTransactions(transactions, 2).filter((t) => {
    const d = new Date(t.date);
    const now = new Date();
    return d.getMonth() === (now.getMonth() - 1 + 12) % 12;
  });
  const last3Months = getMonthlyTransactions(transactions, 3);
  const last6Months = getMonthlyTransactions(transactions, 6);

  const currentCat = categoryTotals(currentMonth);
  const prevCat = categoryTotals(prevMonth);
  const avg3Cat = categoryTotals(last3Months);
  const avg6Cat = categoryTotals(last6Months);

  const allCategories = new Set([...Object.keys(currentCat), ...Object.keys(prevCat), ...Object.keys(avg3Cat), ...Object.keys(avg6Cat)]);

  const result: Record<string, { current: number; avg3: number; avg6: number; prev: number }> = {};
  for (const cat of allCategories) {
    result[cat] = {
      current: currentCat[cat] || 0,
      avg3: Math.round((avg3Cat[cat] || 0) / 3),
      avg6: Math.round((avg6Cat[cat] || 0) / 6),
      prev: prevCat[cat] || 0,
    };
  }
  return result;
}

export function generateExpenseAnalysis(transactions: Transaction[]): ExpenseAnalysis[] {
  const monthly = computeMonthlyAverages(transactions);
  const currentTotal = totalSpending(getMonthlyTransactions(transactions, 1));

  return Object.entries(monthly).map(([category, data]) => {
    const changeVsAvg3 = data.avg3 > 0 ? Math.round(((data.current - data.avg3) / data.avg3) * 100) : 0;
    const changeVsAvg6 = data.avg6 > 0 ? Math.round(((data.current - data.avg6) / data.avg6) * 100) : 0;
    const changeVsPrevious = data.prev > 0 ? Math.round(((data.current - data.prev) / data.prev) * 100) : 0;

    let trend: "increasing" | "decreasing" | "stable" = "stable";
    if (changeVsAvg3 > 10 || changeVsPrevious > 15) trend = "increasing";
    else if (changeVsAvg3 < -10 || changeVsPrevious < -15) trend = "decreasing";

    const isAlert = changeVsAvg3 > 15 || (data.avg3 > 0 && data.current > data.avg3 * 1.3);

    return {
      category,
      currentMonth: data.current,
      average3Month: data.avg3,
      average6Month: data.avg6,
      previousMonth: data.prev,
      changeVsAvg3,
      changeVsAvg6,
      changeVsPrevious,
      percentageOfTotal: currentTotal > 0 ? Math.round((data.current / currentTotal) * 100) : 0,
      trend,
      isAlert,
    };
  });
}

export function categoryInsights(analysis: ExpenseAnalysis[]): AIInsight[] {
  const insights: AIInsight[] = [];
  for (const a of analysis) {
    if (a.isAlert) {
      const direction = a.changeVsAvg3 > 0 ? "up" : "down";
      insights.push({
        id: `insight-${a.category}-${Date.now()}`,
        title: `${CATEGORY_LABELS[a.category as keyof typeof CATEGORY_LABELS] || a.category} spending is ${direction} ${Math.abs(a.changeVsAvg3)}% vs 3-month average`,
        description: `Current: ₹${a.currentMonth.toLocaleString()} vs 3-month avg of ₹${a.average3Month.toLocaleString()}. Represents ${a.percentageOfTotal}% of total spending.`,
        metric: { value: `${direction === "up" ? "+" : ""}${a.changeVsAvg3}%`, direction, positive: direction === "down" },
        type: "spending",
        severity: a.changeVsAvg3 > 20 ? "critical" : "warning",
      });
    }
    if (a.trend === "decreasing" && a.changeVsAvg3 < -15) {
      insights.push({
        id: `insight-${a.category}-positive-${Date.now()}`,
        title: `${CATEGORY_LABELS[a.category as keyof typeof CATEGORY_LABELS] || a.category} spending dropped ${Math.abs(a.changeVsAvg3)}% this month`,
        description: `Down from ₹${a.average3Month.toLocaleString()} avg to ₹${a.currentMonth.toLocaleString()}. Good progress!`,
        metric: { value: `${a.changeVsAvg3}%`, direction: "down", positive: true },
        type: "pattern",
        severity: "info",
      });
    }
  }
  return insights;
}

export function detectAnomalies(transactions: Transaction[]): AIInsight[] {
  const insights: AIInsight[] = [];
  const merchantMap: Record<string, Transaction[]> = {};
  for (const tx of transactions) {
    if (!merchantMap[tx.merchant]) merchantMap[tx.merchant] = [];
    merchantMap[tx.merchant].push(tx);
  }
  for (const [, txs] of Object.entries(merchantMap)) {
    const dates = txs.map((t) => t.date);
    const uniqueDates = [...new Set(dates)];
    if (uniqueDates.length < dates.length) {
      const duplicates = txs.filter((t) => dates.filter((d) => d === t.date).length > 1);
      insights.push({
        id: `anomaly-${txs[0].merchant}-${Date.now()}`,
        title: `Duplicate payment detected at ${txs[0].merchant}`,
        description: `${duplicates.length} transactions totaling ₹${duplicates.reduce((s, t) => s + t.amount, 0).toLocaleString()} on the same date(s).`,
        type: "anomaly",
        severity: "critical",
      });
    }
  }
  const subThreshold = 2000;
  const subs = transactions.filter((t) => {
    const name = t.merchant.toLowerCase();
    return (name.includes("netflix") || name.includes("spotify") || name.includes("prime") || name.includes("cloud") || name.includes("subscription")) && t.amount < subThreshold;
  });
  if (subs.length >= 2) {
    const total = subs.reduce((s, t) => s + t.amount, 0);
    insights.push({
      id: `subscription-creep-${Date.now()}`,
      title: `Subscription services consuming ₹${total.toLocaleString()}/month`,
      description: `${subs.length} recurring services detected. Review for overlap or unused subscriptions.`,
      metric: { value: `₹${total.toLocaleString()}/mo`, direction: "up", positive: false },
      type: "subscription",
      severity: "warning",
    });
  }
  return insights;
}

export function generatePredictionsFromData(transactions: Transaction[], income: number): PredictionResult[] {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyData: Record<string, number> = {};
  for (const tx of transactions) {
    const d = new Date(tx.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthlyData[key] = (monthlyData[key] || 0) + tx.amount;
  }

  const values = Object.values(monthlyData);
  const avgSpending = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 47900;
  const variance = values.length > 1
    ? values.reduce((s, v) => s + Math.pow(v - avgSpending, 2), 0) / values.length
    : 2000000;
  const stdDev = Math.sqrt(variance);

  const predictions: PredictionResult[] = [];
  for (let i = 0; i < 3; i++) {
    const monthIdx = (currentMonth + 1 + i) % 12;
    const monthName = monthNames[monthIdx];
    const yearLabel = monthIdx < currentMonth ? currentYear + 1 : currentYear;

    const seasonalFactor = monthIdx >= 9 && monthIdx <= 11 ? 1.08 : monthIdx >= 4 && monthIdx <= 6 ? 0.95 : 1.0;
    const predicted = Math.round(avgSpending * seasonalFactor + (i === 0 ? 0 : i === 1 ? Math.round(stdDev * 0.3) : Math.round(stdDev * 0.6)));
    const predictedSavings = Math.max(0, income - predicted);

    predictions.push({
      month: `${monthName} ${yearLabel}`,
      predictedExpenses: predicted,
      predictedSavings,
      confidence: Math.max(50, Math.round(90 - i * 10 - (stdDev / avgSpending) * 20)),
      cashFlow: income - predicted,
      budgetOverflow: predicted > avgSpending * 1.05,
      goalCompletionPercent: Math.min(100, 70 + i * 5),
    });
  }
  return predictions;
}

export function generateRecommendationsFromData(analysis: ExpenseAnalysis[], income: number, transactions: Transaction[], goals: FinancialGoal[]): AIRecommendation[] {
  const recs: AIRecommendation[] = [];
  const currentTotal = totalSpending(getMonthlyTransactions(transactions, 1));
  const rate = savingsRate(income, currentTotal);

  const alerts = analysis.filter((a) => a.isAlert).sort((a, b) => b.changeVsAvg3 - a.changeVsAvg3);
  for (const alert of alerts) {
    const overage = alert.currentMonth - alert.average3Month;
    if (overage > 0 && alert.percentageOfTotal > 5) {
      const annualSavings = overage * 12;
      recs.push({
        id: `rec-spend-${alert.category}-${Date.now()}`,
        title: `Reduce ${CATEGORY_LABELS[alert.category as keyof typeof CATEGORY_LABELS] || alert.category} spending`,
        description: `You spent ₹${alert.currentMonth.toLocaleString()} vs your 3-month average of ₹${alert.average3Month.toLocaleString()} (${alert.changeVsAvg3 > 0 ? "+" : ""}${alert.changeVsAvg3}%).`,
        category: "spending",
        impact: annualSavings > 24000 ? "high" : annualSavings > 12000 ? "medium" : "low",
        potentialSavings: annualSavings,
        reasoning: `Reducing ${alert.category} spending by ₹${(overage / 2).toFixed(0)}/month would save ₹${(annualSavings / 2).toLocaleString()}/year while still allowing some flexibility.`,
        confidence: Math.round(Math.max(60, 90 - Math.abs(alert.changeVsAvg3) * 0.5)),
        evidence: [
          { label: `${CATEGORY_LABELS[alert.category as keyof typeof CATEGORY_LABELS]} Current`, currentValue: `₹${alert.currentMonth.toLocaleString()}`, previousValue: `₹${alert.previousMonth.toLocaleString()}`, benchmark: `₹${alert.average3Month.toLocaleString()}`, difference: `+${alert.changeVsAvg3}%`, direction: "up", positive: false },
          { label: "Monthly Overage", currentValue: `₹${overage.toLocaleString()}`, difference: `₹${(overage * 12).toLocaleString()}/yr`, direction: "up", positive: false },
          { label: "% of Total Spending", currentValue: `${alert.percentageOfTotal}%`, difference: `${alert.percentageOfTotal}% of income`, direction: "neutral", positive: true },
        ],
        whyItMatters: `This category represents ${alert.percentageOfTotal}% of your total monthly spending. A ${Math.round(alert.changeVsAvg3)}% increase month over month compounds to significant annual leakage.`,
        expectedResult: `Reduce ${CATEGORY_LABELS[alert.category as keyof typeof CATEGORY_LABELS]} to 3-month average level`,
        annualSavings,
      });
    }
  }

  if (goals.length > 0) {
    for (const goal of goals) {
      const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
      if (progress < 50) {
        const monthlyNeeded = goal.targetAmount / 12;
        recs.push({
          id: `rec-goal-${goal.id}-${Date.now()}`,
          title: `Accelerate ${goal.title} progress`,
          description: `You're at ${Math.round(progress)}% of your ₹${goal.targetAmount.toLocaleString()} target. Current pace: ₹${goal.currentAmount.toLocaleString()}.`,
          category: "savings",
          impact: progress < 25 ? "high" : "medium",
          potentialSavings: 0,
          reasoning: `Increasing monthly allocation by ₹${Math.round(monthlyNeeded * 0.2)} would bring your target date closer by approximately 3 months.`,
          confidence: 82,
          evidence: [
            { label: "Goal Progress", currentValue: `${Math.round(progress)}%`, previousValue: `₹${goal.currentAmount.toLocaleString()}`, benchmark: `₹${goal.targetAmount.toLocaleString()}`, difference: `${(100 - progress).toFixed(0)}% remaining`, direction: "up", positive: false },
            { label: "Monthly Needed", currentValue: `₹${Math.round(monthlyNeeded).toLocaleString()}`, difference: `₹${Math.round(monthlyNeeded * 0.2).toLocaleString()} extra/mo`, direction: "up", positive: false },
          ],
          whyItMatters: `Reaching your ${goal.title} goal of ₹${(goal.targetAmount / 100000).toFixed(1)}L builds financial security and reduces stress about this milestone.`,
          expectedResult: `₹${Math.round(goal.currentAmount + monthlyNeeded * 0.2 * 6).toLocaleString()} in 6 months at increased rate`,
          annualSavings: 0,
        });
      }
    }
  }

  return recs.sort((a, b) => {
    const impactOrder = { high: 3, medium: 2, low: 1 };
    const aScore = impactOrder[a.impact] * 100 + (a.potentialSavings || 0);
    const bScore = impactOrder[b.impact] * 100 + (b.potentialSavings || 0);
    return bScore - aScore;
  });
}

export function generateStructuredResponse(
  query: string,
  analysis: ExpenseAnalysis[],
  transactions: Transaction[],
  income: number,
  goals: FinancialGoal[]
): string {
  const currentTotal = totalSpending(getMonthlyTransactions(transactions, 1));
  const rate = savingsRate(income, currentTotal);
  const alerts = analysis.filter((a) => a.isAlert).sort((a, b) => b.changeVsAvg3 - a.changeVsAvg3);

  let situation = "";
  let evidence = "";
  let whyItMatters = "";
  let recommendation = "";
  let expectedResult = "";
  let confidenceScore = "";

  const q = query.toLowerCase();

  if (q.includes("tax") || q.includes("regime")) {
    let incomeToUse = income;
    const matchNumber = q.match(/(\d+[\d,]*)/);
    if (matchNumber) {
      const parsedNum = parseFloat(matchNumber[1].replace(/,/g, ""));
      if (parsedNum > 0) {
        incomeToUse = parsedNum > 200000 ? Math.round(parsedNum / 12) : parsedNum;
      }
    }
    const taxRes = calculateIndianTax(incomeToUse);
    situation = `Comparing the Old vs New Tax Regime for a monthly income of ₹${incomeToUse.toLocaleString()} (Annual: ₹${taxRes.annualIncome.toLocaleString()}).`;
    evidence = `New Regime Tax: ₹${taxRes.newRegimeTax.toLocaleString()} (includes ₹75k standard deduction)
Old Regime Tax: ₹${taxRes.oldRegimeTax.toLocaleString()} (includes ₹2.25L deductions/exemptions)
Savings: ₹${taxRes.taxSavings.toLocaleString()}/year under the ${taxRes.recommendedRegime.toUpperCase()} Regime.`;
    whyItMatters = `Choosing the optimal tax regime is critical to maximize your disposable income. Selecting the wrong regime would cost you an extra ₹${taxRes.taxSavings.toLocaleString()} in taxes this year.`;
    recommendation = `Opt for the ${taxRes.recommendedRegime.toUpperCase()} Tax Regime. File Form 10-IEA if you have business income and wish to switch.`;
    expectedResult = `Tax Liability: ₹${(taxRes.recommendedRegime === "new" ? taxRes.newRegimeTax : taxRes.oldRegimeTax).toLocaleString()}/year. Net Annual Savings: ₹${taxRes.taxSavings.toLocaleString()}.`;
  } else if (q.includes("sip") || q.includes("compound") || q.includes("wealth") || q.includes("step-up") || q.includes("invest")) {
    let sipAmt = 10000;
    let years = 15;
    const numbers = q.match(/\d+[\d,]*/g);
    if (numbers && numbers.length > 0) {
      sipAmt = parseFloat(numbers[0].replace(/,/g, ""));
      if (numbers.length > 1) {
        const secondNum = parseFloat(numbers[1].replace(/,/g, ""));
        if (secondNum < 50) years = secondNum;
      }
    }
    const sipRes = calculateSIPWealth(sipAmt, years, 12);
    situation = `Compounding projection for a monthly SIP of ₹${sipAmt.toLocaleString()} over ${years} years at 12% expected return.`;
    evidence = `Standard SIP: Total Invested ₹${sipRes.totalInvested.toLocaleString()} | Future Value ₹${sipRes.estimatedWealth.toLocaleString()} | Gain ₹${sipRes.wealthGain.toLocaleString()}
10% Step-Up SIP: Total Invested ₹${sipRes.stepUpInvested.toLocaleString()} | Future Value ₹${sipRes.stepUpWealth.toLocaleString()} | Gain ₹${sipRes.stepUpGain.toLocaleString()}`;
    whyItMatters = `Stepping up your monthly SIP by 10% annually increases your final accumulated wealth by ₹${(sipRes.stepUpWealth - sipRes.estimatedWealth).toLocaleString()} (+${Math.round(((sipRes.stepUpWealth - sipRes.estimatedWealth) / sipRes.estimatedWealth) * 100)}%).`;
    recommendation = `Set up an automated monthly Mutual Fund SIP for ₹${sipAmt.toLocaleString()} and select the 10% Auto Step-up option.`;
    expectedResult = `Estimated wealth of ₹${sipRes.stepUpWealth.toLocaleString()} after ${years} years.`;
  } else if (q.includes("save") || q.includes("savings") || q.includes("waste") || q.includes("wasting")) {
    if (alerts.length > 0) {
      const top = alerts[0];
      situation = `Your ${CATEGORY_LABELS[top.category as keyof typeof CATEGORY_LABELS] || top.category} spending increased by ${Math.abs(top.changeVsAvg3)}% compared to your 3-month average (₹${top.currentMonth.toLocaleString()} vs ₹${top.average3Month.toLocaleString()}).`;
      evidence = `Category: ${CATEGORY_LABELS[top.category as keyof typeof CATEGORY_LABELS]}
Current: ₹${top.currentMonth.toLocaleString()}
3-Month Avg: ₹${top.average3Month.toLocaleString()}
Difference: +${top.changeVsAvg3}%
% of Total: ${top.percentageOfTotal}%`;
      whyItMatters = `At this rate, you're spending ₹${(top.currentMonth - top.average3Month).toLocaleString()} extra per month in this category alone — that's ₹${((top.currentMonth - top.average3Month) * 12).toLocaleString()} annually that could go toward your goals.`;
      recommendation = `Reduce ${CATEGORY_LABELS[top.category as keyof typeof CATEGORY_LABELS] || top.category} spending by ₹${Math.round((top.currentMonth - top.average3Month) / 2).toLocaleString()}/month by setting a monthly cap.`;
      expectedResult = `Annual Savings: ₹${Math.round((top.currentMonth - top.average3Month) / 2 * 12).toLocaleString()}`;
    } else if (analysis.length > 0) {
      const highest = analysis.sort((a, b) => b.currentMonth - a.currentMonth)[0];
      situation = `Your largest expense category is ${CATEGORY_LABELS[highest.category as keyof typeof CATEGORY_LABELS] || highest.category} at ₹${highest.currentMonth.toLocaleString()}/month (${highest.percentageOfTotal}% of total).`;
      evidence = `Category: ${CATEGORY_LABELS[highest.category as keyof typeof CATEGORY_LABELS]}
Current: ₹${highest.currentMonth.toLocaleString()}
Previous: ₹${highest.previousMonth.toLocaleString()}
% of Total: ${highest.percentageOfTotal}%`;
      whyItMatters = `Your largest spending category naturally has the biggest impact on your savings rate. Even a 10% reduction here would save ₹${Math.round(highest.currentMonth * 0.1).toLocaleString()}/month.`;
      recommendation = `Review your ${CATEGORY_LABELS[highest.category as keyof typeof CATEGORY_LABELS]} spending and identify one specific area to cut by 10%.`;
      expectedResult = `Annual Savings: ₹${(Math.round(highest.currentMonth * 0.1 * 12)).toLocaleString()}`;
    } else {
      situation = `I don't have enough transaction data to analyze your spending patterns.`;
      evidence = `Transactions found: ${transactions.length}`;
      whyItMatters = `Without sufficient data, I cannot provide meaningful waste-reduction advice.`;
      recommendation = `Upload at least one month of transactions or connect your expense sources to get personalized savings recommendations.`;
      expectedResult = `N/A — need more data`;
    }
  } else if (q.includes("afford") || q.includes("vacation") || q.includes("trip") || q.includes("buy")) {
    situation = `Your current monthly income is ₹${(income / 1000).toFixed(0)}K and your spending is ₹${(currentTotal / 1000).toFixed(0)}K, leaving ₹${((income - currentTotal) / 1000).toFixed(0)}K in disposable income.`;
    evidence = `Income: ₹${(income / 1000).toFixed(0)}K/mo
Spending: ₹${(currentTotal / 1000).toFixed(0)}K/mo
Disposable: ₹${((income - currentTotal) / 1000).toFixed(0)}K/mo
Savings Rate: ${rate.toFixed(0)}%`;
    whyItMatters = `Your savings rate of ${rate.toFixed(0)}% ${rate >= 20 ? "is healthy, but" : "is below the recommended 20% benchmark."} Any large expense should be evaluated against your existing financial goals.`;
    recommendation = rate >= 15
      ? `You can afford a moderate expense (₹${Math.round((income - currentTotal) * 0.5).toLocaleString()}) while maintaining your current savings rate. Plan ahead and set aside the amount over 2-3 months.`
      : `I recommend delaying large non-essential purchases until your savings rate improves to at least 15%. Focus on reducing ${alerts.length > 0 ? alerts[0].category : "non-essential"} spending first.`;
    expectedResult = rate >= 15
      ? `Set aside ₹${Math.round((income - currentTotal) * 0.5 / 3).toLocaleString()}/month for 3 months`
      : `Achieve 15% savings rate (₹${Math.round(income * 0.15).toLocaleString()}/mo) before making the purchase`;
  } else if (q.includes("budget") || q.includes("follow")) {
    situation = `Based on your last month's spending of ₹${(currentTotal / 1000).toFixed(0)}K against a ₹${(income / 1000).toFixed(0)}K income, here is a recommended budget:`;
    evidence = `50% Needs (Housing, Utilities, Transport): ₹${Math.round(income * 0.5).toLocaleString()}/mo
30% Wants (Food, Shopping, Entertainment): ₹${Math.round(income * 0.3).toLocaleString()}/mo
20% Savings & Investments: ₹${Math.round(income * 0.2).toLocaleString()}/mo`;
    whyItMatters = `The 50/30/20 rule is a proven framework that balances essential spending, lifestyle choices, and long-term wealth building.`;
    recommendation = alerts.length > 0
      ? `Start by addressing ${alerts[0].category} (currently ${alerts[0].percentageOfTotal}% of spending) to align with the 50/30/20 framework.`
      : `Track your spending against these buckets for 2 months, then adjust based on your priorities.`;
    expectedResult = `Monthly savings of ₹${Math.round(income * 0.2).toLocaleString()} = ₹${Math.round(income * 0.2 * 12).toLocaleString()}/year`;
  } else if (q.includes("health") || q.includes("score")) {
    const debtRatio = 82;
    situation = `Your Financial Health Score is calculated from 8 weighted factors based on your actual financial data.`;
    evidence = `Savings Rate: ${rate.toFixed(0)}% (${rate >= 20 ? "Excellent" : rate >= 10 ? "Moderate" : "Needs Work"})
Debt Ratio: ${debtRatio}/100
Emergency Fund: ${goals.find(g => g.type === "emergency-fund") ? `${Math.round((goals.find(g => g.type === "emergency-fund")!.currentAmount / goals.find(g => g.type === "emergency-fund")!.targetAmount) * 100)}% funded` : "Not set up"}
Budget Adherence: ${alerts.filter(a => a.isAlert).length === 0 ? "Good" : `${alerts.filter(a => a.isAlert).length} categories over budget`}`;
    whyItMatters = `Each factor represents a pillar of financial health. Improving your weakest areas has the highest impact on your overall score.`;
    recommendation = rate < 20
      ? `Increase your savings rate to 20% (₹${Math.round(income * 0.2).toLocaleString()}/mo). Currently saving ₹${Math.round(income - currentTotal).toLocaleString()}/mo.`
      : `Your savings rate is healthy. Focus on optimizing investment allocation and goal progress.`;
    expectedResult = rate < 20
      ? `₹${Math.round((income * 0.2 - (income - currentTotal))).toLocaleString()} additional monthly savings`
      : `Review investment portfolio for diversification`;
  } else {
    situation = `Your financial snapshot: Income ₹${(income / 1000).toFixed(0)}K/mo, Spending ₹${(currentTotal / 1000).toFixed(0)}K/mo, Savings Rate ${rate.toFixed(0)}%.`;
    evidence = `Total Transactions: ${transactions.length}
Categories Active: ${analysis.length}
Highest Category: ${analysis.sort((a, b) => b.currentMonth - a.currentMonth)[0]?.category || "N/A"}
Goals Active: ${goals.length}`;
    whyItMatters = `Understanding where your money goes each month is the first step toward making informed financial decisions.`;
    recommendation = rate < 10
      ? `Your savings rate of ${rate.toFixed(0)}% is below the recommended 20%. Focus on reducing expenses or increasing income.`
      : rate < 20
        ? `Your savings rate of ${rate.toFixed(0)}% is decent. Consider increasing it to 20% for optimal financial health.`
        : `Your savings rate of ${rate.toFixed(0)}% is excellent. Focus on optimizing investment allocation for long-term growth.`;
    expectedResult = `Target: ${rate < 20 ? "20% savings rate" : "Optimized investment allocation"}`;
  }

  const conf = Math.round(Math.min(95, 60 + (alerts.length > 0 ? 15 : 0) + (transactions.length >= 5 ? 10 : 0) + (goals.length > 0 ? 5 : 0) + (analysis.length >= 3 ? 5 : 0)));

  return [
    `**Current Situation**\n${situation}`,
    `**Evidence**\n${evidence}`,
    `**Why It Matters**\n${whyItMatters}`,
    `**Recommendation**\n${recommendation}`,
    `**Expected Result**\n${expectedResult}`,
    `**Confidence Score: ${conf}%**\nBased on ${transactions.length} transactions, ${analysis.length} categories, and ${goals.length} financial goals.`,
  ].join("\n\n");
}

export function generateFollowUpQuestions(transactions: Transaction[], income: number | null, goals: FinancialGoal[]): { question: string; context: string }[] {
  const questions: { question: string; context: string }[] = [];
  if (!income || income <= 0) {
    questions.push({ question: "What is your monthly income?", context: "I need your income to calculate savings rate and provide personalized advice." });
  }
  if (transactions.length < 3) {
    questions.push({ question: "Can you add some recent transactions or expenses?", context: "I need at least a few transactions to analyze your spending patterns." });
  }
  if (goals.length === 0) {
    questions.push({ question: "What are your financial goals?", context: "Knowing your goals helps me prioritize recommendations that matter most to you." });
  }
  const latestTx = transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  if (latestTx.length > 0) {
    const latestDate = new Date(latestTx[0].date);
    const daysSince = Math.round((Date.now() - latestDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > 60) {
      questions.push({ question: "Your last transaction was over 2 months ago. Do you have more recent expenses to add?", context: "Recent data helps me provide accurate, timely advice." });
    }
  }
  return questions;
}

export function searchFinancialBooks(query: string): { passage: string; source: string; confidence: number }[] {
  const q = query.toLowerCase();
  const results: { passage: string; source: string; confidence: number }[] = [];
  for (const guru of GURU_KNOWLEDGE) {
    for (const book of guru.books) {
      for (const passage of book.passages) {
        const pLower = passage.toLowerCase();
        const matchCount = q.split(" ").filter((w) => pLower.includes(w)).length;
        if (matchCount > 0) {
          results.push({
            passage,
            source: `${book.title} - ${guru.name}`,
            confidence: Math.round((matchCount / q.split(" ").length) * 100),
          });
        }
      }
    }
  }
  return results.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}

export function isWeekend(dateStr: string): boolean {
  const day = new Date(dateStr).getDay();
  return day === 0 || day === 6;
}

export function analyzeWeekendVsWeekday(transactions: Transaction[]): {
  weekendTotal: number;
  weekdayTotal: number;
  weekendCount: number;
  weekdayCount: number;
  weekendAvg: number;
  weekdayAvg: number;
  weekendPercentage: number;
  insights: AIInsight[];
} {
  const weekend = transactions.filter((t) => isWeekend(t.date));
  const weekday = transactions.filter((t) => !isWeekend(t.date));
  const weekendTotal = weekend.reduce((s, t) => s + t.amount, 0);
  const weekdayTotal = weekday.reduce((s, t) => s + t.amount, 0);
  const insights: AIInsight[] = [];

  if (transactions.length >= 5) {
    const weekendPct = (weekend.length / transactions.length) * 100;
    const weekendAmtPct = (weekendTotal / (weekendTotal + weekdayTotal || 1)) * 100;
    if (weekendAmtPct > 40) {
      insights.push({
        id: `weekend-spike-${Date.now()}`,
        title: `Weekend spending accounts for ${Math.round(weekendAmtPct)}% of total`,
        description: `${weekend.length} weekend transactions totaling ₹${weekendTotal.toLocaleString()}. Consider if these are planned or impulse purchases.`,
        metric: { value: `${Math.round(weekendAmtPct)}%`, direction: "up", positive: false },
        type: "pattern",
        severity: "warning",
      });
    } else if (weekendAmtPct < 15 && transactions.length > 5) {
      insights.push({
        id: `weekend-low-${Date.now()}`,
        title: `Weekend spending is well-controlled at ${Math.round(weekendAmtPct)}%`,
        description: `Only ₹${weekendTotal.toLocaleString()} spent on weekends. Good discipline.`,
        metric: { value: `${Math.round(weekendAmtPct)}%`, direction: "down", positive: true },
        type: "pattern",
        severity: "info",
      });
    }
  }

  return {
    weekendTotal,
    weekdayTotal,
    weekendCount: weekend.length,
    weekdayCount: weekday.length,
    weekendAvg: weekend.length > 0 ? Math.round(weekendTotal / weekend.length) : 0,
    weekdayAvg: weekday.length > 0 ? Math.round(weekdayTotal / weekday.length) : 0,
    weekendPercentage: (weekendTotal / (weekendTotal + weekdayTotal || 1)) * 100,
    insights,
  };
}

export function analyzeMerchantFrequency(transactions: Transaction[]): {
  topMerchants: { merchant: string; count: number; total: number; category: string }[];
  insights: AIInsight[];
} {
  const freq: Record<string, { count: number; total: number; category: string }> = {};
  for (const tx of transactions) {
    if (!freq[tx.merchant]) freq[tx.merchant] = { count: 0, total: 0, category: tx.category };
    freq[tx.merchant].count++;
    freq[tx.merchant].total += tx.amount;
  }

  const topMerchants = Object.entries(freq)
    .map(([merchant, data]) => ({ merchant, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const insights: AIInsight[] = [];
  const frequent = topMerchants.filter((m) => m.count >= 3);
  if (frequent.length > 0) {
    insights.push({
      id: `merchant-freq-${Date.now()}`,
      title: `${frequent[0].merchant} is your most frequent merchant (${frequent[0].count} visits)`,
      description: `You've visited ${frequent[0].merchant} ${frequent[0].count} times totaling ₹${frequent[0].total.toLocaleString()}. ${frequent.length > 1 ? `Other frequent: ${frequent.slice(1, 3).map((m) => m.merchant).join(", ")}.` : ""}`,
      type: "pattern",
      severity: "info",
    });
  }

  const recurring = topMerchants.filter((m) => {
    const merchantTx = transactions.filter((t) => t.merchant === m.merchant);
    const dates = [...new Set(merchantTx.map((t) => t.date))];
    return m.count >= 2 && dates.length === m.count;
  });
  if (recurring.length > 0 && !insights.some((i) => i.type === "subscription")) {
    const totalMonthly = recurring.reduce((s, m) => s + Math.round(m.total / Math.max(1, m.count)), 0);
    insights.push({
      id: `recurring-merchants-${Date.now()}`,
      title: `${recurring.length} recurring merchants detected (≈₹${totalMonthly.toLocaleString()}/mo)`,
      description: recurring.slice(0, 3).map((m) => `${m.merchant}: ₹${Math.round(m.total / m.count)}/visit`).join(", "),
      metric: { value: `₹${totalMonthly.toLocaleString()}/mo`, direction: "up", positive: false },
      type: "subscription",
      severity: "info",
    });
  }

  return { topMerchants, insights };
}

export function detectSpendingSpikes(transactions: Transaction[]): AIInsight[] {
  const insights: AIInsight[] = [];
  const byDate: Record<string, Transaction[]> = {};
  for (const tx of transactions) {
    if (!byDate[tx.date]) byDate[tx.date] = [];
    byDate[tx.date].push(tx);
  }

  const dailyTotals = Object.entries(byDate).map(([date, txs]) => ({
    date,
    total: txs.reduce((s, t) => s + t.amount, 0),
    count: txs.length,
  }));

  if (dailyTotals.length < 3) return insights;

  const amounts = dailyTotals.map((d) => d.total);
  const mean = amounts.reduce((s, v) => s + v, 0) / amounts.length;
  const variance = amounts.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / amounts.length;
  const stdDev = Math.sqrt(variance);
  const threshold = mean + stdDev * 2;

  const spikes = dailyTotals.filter((d) => d.total > threshold && d.total > mean * 1.5);
  for (const spike of spikes) {
    const merchants = byDate[spike.date].map((t) => `${t.merchant} (₹${t.amount})`).join(", ");
    insights.push({
      id: `spike-${spike.date}-${Date.now()}`,
      title: `Spending spike on ${spike.date}: ₹${spike.total.toLocaleString()}`,
      description: `${spike.count} transactions on this day. Merchants: ${merchants}. This is ${Math.round((spike.total / mean) * 100)}% above your daily average of ₹${Math.round(mean).toLocaleString()}.`,
      metric: { value: `₹${spike.total.toLocaleString()}`, direction: "up", positive: false },
      type: "anomaly",
      severity: "warning",
    });
  }

  return insights;
}

export function getGoalsFromStore(): FinancialGoal[] {
  if (typeof window === "undefined") return [];
  try {
    const { useGoalsStore } = require("@/store/goals-store");
    return useGoalsStore.getState().goals || [];
  } catch {
    return [];
  }
}

export function computeMonthlyTrend(transactions: Transaction[]): { month: string; spending: number; savings: number }[] {
  const monthly: Record<string, number> = {};
  for (const tx of transactions) {
    const d = new Date(tx.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthly[key] = (monthly[key] || 0) + tx.amount;
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return Object.entries(monthly)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, spending]) => {
      const [year, monthNum] = key.split("-").map(Number);
      return {
        month: `${monthNames[monthNum - 1]} ${year}`,
        spending: Math.round(spending),
        savings: 0,
      };
    });
}

export function zScoreAnomalyDetection(transactions: Transaction[]): AIInsight[] {
  if (transactions.length < 5) return [];
  const byCategory = groupByCategory(transactions);
  const insights: AIInsight[] = [];

  for (const [category, txs] of Object.entries(byCategory)) {
    const amounts = txs.map((t) => t.amount);
    const mean = amounts.reduce((s, v) => s + v, 0) / amounts.length;
    const variance = amounts.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev === 0) continue;

    for (const tx of txs) {
      const z = (tx.amount - mean) / stdDev;
      if (Math.abs(z) > 2.5) {
        insights.push({
          id: `zscore-${tx.id}-${Date.now()}`,
          title: `Unusual ${tx.merchant} transaction (Z-score: ${z.toFixed(1)})`,
          description: `₹${tx.amount.toLocaleString()} is ${Math.abs(z).toFixed(1)} standard deviations from the ${category} average of ₹${Math.round(mean).toLocaleString()}. ${z > 0 ? "Significantly higher than usual." : "Unusually low for this category."}`,
          metric: { value: `z=${z.toFixed(1)}`, direction: z > 0 ? "up" : "down", positive: z < 0 },
          type: "anomaly",
          severity: Math.abs(z) > 3 ? "critical" : "warning",
        });
      }
    }
  }
  return insights;
}

export function iqrAnomalyDetection(transactions: Transaction[]): AIInsight[] {
  if (transactions.length < 5) return [];
  const byCategory = groupByCategory(transactions);
  const insights: AIInsight[] = [];

  for (const [category, txs] of Object.entries(byCategory)) {
    const sorted = [...txs].sort((a, b) => a.amount - b.amount);
    const q1 = sorted[Math.floor(sorted.length * 0.25)].amount;
    const q3 = sorted[Math.floor(sorted.length * 0.75)].amount;
    const iqr = q3 - q1;
    const lowerFence = q1 - 1.5 * iqr;
    const upperFence = q3 + 1.5 * iqr;

    for (const tx of txs) {
      if (tx.amount > upperFence) {
        insights.push({
          id: `iqr-${tx.id}-${Date.now()}`,
          title: `Outlier: ${tx.merchant} at ₹${tx.amount.toLocaleString()}`,
          description: `This ${category} expense exceeds the IQR upper fence (₹${Math.round(upperFence).toLocaleString()}) for this category. Q1=₹${q1}, Q3=₹${q3}, IQR=₹${iqr}.`,
          metric: { value: `₹${tx.amount.toLocaleString()}`, direction: "up", positive: false },
          type: "anomaly",
          severity: tx.amount > q3 + 3 * iqr ? "critical" : "warning",
        });
      } else if (tx.amount < lowerFence && tx.amount > 0) {
        insights.push({
          id: `iqr-low-${tx.id}-${Date.now()}`,
          title: `Unusually low ${tx.merchant} expense`,
          description: `₹${tx.amount} is below the IQR lower fence for ${category} (₹${Math.round(lowerFence).toLocaleString()}).`,
          metric: { value: `₹${tx.amount.toLocaleString()}`, direction: "down", positive: true },
          type: "anomaly",
          severity: "info",
        });
      }
    }
  }
  return insights;
}

export function seasonalTrendDetection(transactions: Transaction[]): AIInsight[] {
  const insights: AIInsight[] = [];
  const byMonth: Record<string, number> = {};
  for (const tx of transactions) {
    const d = new Date(tx.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    byMonth[key] = (byMonth[key] || 0) + tx.amount;
  }

  const months = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b));
  if (months.length < 3) return insights;

  const values = months.map(([, v]) => v);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  for (const [key, spending] of months) {
    const [year, monthIdx] = key.split("-").map(Number);
    const ratio = spending / mean;
    if (ratio > 1.25) {
      insights.push({
        id: `seasonal-${key}-${Date.now()}`,
        title: `${monthNames[monthIdx]} ${year} spending was ${Math.round((ratio - 1) * 100)}% above average`,
        description: `₹${spending.toLocaleString()} vs monthly average of ₹${Math.round(mean).toLocaleString()}. Seasonal pattern detected.`,
        metric: { value: `+${Math.round((ratio - 1) * 100)}%`, direction: "up", positive: false },
        type: "pattern",
        severity: "warning",
      });
    } else if (ratio < 0.75) {
      insights.push({
        id: `seasonal-low-${key}-${Date.now()}`,
        title: `${monthNames[monthIdx]} ${year} spending was ${Math.round((1 - ratio) * 100)}% below average`,
        description: `₹${spending.toLocaleString()} vs monthly average of ₹${Math.round(mean).toLocaleString()}.`,
        metric: { value: `${Math.round((ratio - 1) * 100)}%`, direction: "down", positive: true },
        type: "pattern",
        severity: "info",
      });
    }
  }
  return insights;
}

export function budgetOverrunAnalysis(transactions: Transaction[], budgets?: Record<string, number>): AIInsight[] {
  const insights: AIInsight[] = [];
  const currentMonth = getMonthlyTransactions(transactions, 1);
  const totals = categoryTotals(currentMonth);

  const defaultBudgets: Record<string, number> = budgets || {
    food: 12000, transport: 6000, entertainment: 3000, utilities: 5000,
    shopping: 8000, health: 3000, housing: 20000, other: 3000,
  };

  for (const [category, spent] of Object.entries(totals)) {
    const limit = defaultBudgets[category];
    if (!limit || limit <= 0) continue;
    if (spent > limit) {
      const overPercent = Math.round(((spent - limit) / limit) * 100);
      insights.push({
        id: `budget-overrun-${category}-${Date.now()}`,
        title: `${category} over budget by ${overPercent}%`,
        description: `₹${spent.toLocaleString()} spent vs ₹${limit.toLocaleString()} budget (₹${(spent - limit).toLocaleString()} over).`,
        metric: { value: `+${overPercent}%`, direction: "up", positive: false },
        type: "spending",
        severity: overPercent > 30 ? "critical" : "warning",
      });
    }
  }
  return insights;
}

export interface MonthlyHealthSnapshot {
  month: string;
  overall: number;
  savingsRate: number;
  budgetAdherence: number;
  goalProgress: number;
}

export function computeHealthHistory(transactions: Transaction[], goals: FinancialGoal[], income?: number): MonthlyHealthSnapshot[] {
  const monthlyIncome = income || 75000;
  const byMonth: Record<string, Transaction[]> = {};
  for (const tx of transactions) {
    const d = new Date(tx.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(tx);
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, monthTxs]) => {
      const [year, monthNum] = key.split("-").map(Number);
      const spending = monthTxs.reduce((s, t) => s + t.amount, 0);
      const rate = savingsRate(monthlyIncome, spending);
      const savingsRateScore = Math.min(100, Math.round((rate / 30) * 100));
      const budgetScore = Math.min(100, Math.round(100 - Math.max(0, (spending - monthlyIncome * 0.7) / (monthlyIncome * 0.7) * 100)));
      const goalScore = goals.length > 0
        ? Math.round(goals.reduce((s, g) => s + (g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0), 0) / goals.length)
        : 50;
      const overall = Math.round(savingsRateScore * 0.35 + budgetScore * 0.35 + goalScore * 0.3);

      return {
        month: `${monthNames[monthNum - 1]} ${year}`,
        overall: Math.min(100, Math.max(0, overall)),
        savingsRate: savingsRateScore,
        budgetAdherence: budgetScore,
        goalProgress: goalScore,
      };
    });
}

export function autoRecalculateHealthScore(transactions: Transaction[], goals: FinancialGoal[], income?: number): {
  overall: number;
  savingsRate: number;
  budgetAdherence: number;
  goalProgress: number;
  cashFlow: number;
  explanation: string;
  recommendations: string[];
} {
  const monthlyIncome = income || 75000;
  const currentTotal = totalSpending(getMonthlyTransactions(transactions, 1));
  const savings = Math.max(0, monthlyIncome - currentTotal);
  const rate = savingsRate(monthlyIncome, currentTotal);
  const savingsRateScore = Math.min(100, Math.round((rate / 30) * 100));

  const analysis = generateExpenseAnalysis(transactions);
  const alerts = analysis.filter((a) => a.isAlert);
  const budgetScore = Math.min(100, Math.round(100 - alerts.length * 15));
  const goalScore = goals.length > 0
    ? Math.round(goals.reduce((s, g) => s + (g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0), 0) / goals.length)
    : transactions.length > 0 ? 50 : 0;

  const consistency = analysis.length > 0
    ? Math.round(100 - analysis.filter((a) => Math.abs(a.changeVsAvg3) > 20).length * 10)
    : 70;

  const overall = Math.round(
    savingsRateScore * 0.25 +
    budgetScore * 0.20 +
    goalScore * 0.15 +
    consistency * 0.15 +
    75 * 0.15 +
    65 * 0.10
  );

  const recs: string[] = [];
  if (rate < 20) recs.push(`Increase savings rate from ${Math.round(rate)}% to 20% (save ₹${Math.round(monthlyIncome * 0.2)}/mo)`);
  if (alerts.length > 0) recs.push(`Review ${alerts.length} categories exceeding normal spending: ${alerts.map((a) => a.category).join(", ")}`);
  if (goalScore < 60) recs.push(`Accelerate goal progress — current ${goalScore}% completion rate`);
  if (recs.length === 0) recs.push("Maintain your current habits — all factors are healthy");

  return {
    overall: Math.min(100, Math.max(0, overall)),
    savingsRate: savingsRateScore,
    budgetAdherence: budgetScore,
    goalProgress: goalScore,
    cashFlow: savings,
    explanation: `Score: ${Math.min(100, Math.max(0, overall))}/100. Savings rate: ${Math.round(rate)}%. ${alerts.length} categories over budget. ${goals.length} active goals.`,
    recommendations: recs,
  };
}

/**
 * Calculates Indian income tax comparing Old vs New tax regimes.
 * Supports standard deductions and rebate sections (87A).
 */
export function calculateIndianTax(monthlyIncome: number): {
  annualIncome: number;
  newRegimeTax: number;
  oldRegimeTax: number;
  taxSavings: number;
  recommendedRegime: "new" | "old";
  advice: string;
} {
  const annualIncome = monthlyIncome * 12;

  // New Regime Calculation (FY 2024-25 / AY 2025-26 rules)
  // Standard Deduction: ₹75,000
  const taxableNew = Math.max(0, annualIncome - 75000);
  let newTax = 0;
  if (taxableNew > 300000) {
    if (taxableNew <= 700000) newTax += (taxableNew - 300000) * 0.05;
    else {
      newTax += 400000 * 0.05; // 3L to 7L (5%)
      if (taxableNew <= 1000000) newTax += (taxableNew - 700000) * 0.10;
      else {
        newTax += 300000 * 0.10; // 7L to 10L (10%)
        if (taxableNew <= 1200000) newTax += (taxableNew - 1000000) * 0.15;
        else {
          newTax += 200000 * 0.15; // 10L to 12L (15%)
          if (taxableNew <= 1500000) newTax += (taxableNew - 1200000) * 0.20;
          else {
            newTax += 300000 * 0.20; // 12L to 15L (20%)
            newTax += (taxableNew - 1500000) * 0.30; // Above 15L (30%)
          }
        }
      }
    }
  }
  // Section 87A Rebate: Nil tax up to taxable income of ₹7L
  if (taxableNew <= 700000) {
    newTax = 0;
  }

  // Old Regime Calculation
  // Standard Deduction: ₹50,000, 80C Deduction: ₹1,50,000, 80D: ₹25,000
  const deductionsOld = 50000 + 150000 + 25000;
  const taxableOld = Math.max(0, annualIncome - deductionsOld);
  let oldTax = 0;
  if (taxableOld > 250000) {
    if (taxableOld <= 500000) oldTax += (taxableOld - 250000) * 0.05;
    else {
      oldTax += 250000 * 0.05; // 2.5L to 5L (5%)
      if (taxableOld <= 1000000) oldTax += (taxableOld - 500000) * 0.20;
      else {
        oldTax += 500000 * 0.20; // 5L to 10L (20%)
        oldTax += (taxableOld - 1000000) * 0.30; // Above 10L (30%)
      }
    }
  }
  // Section 87A Rebate for Old Regime: Nil tax up to taxable income of ₹5L
  if (taxableOld <= 500000) {
    oldTax = 0;
  }

  // Add 4% Health & Education Cess
  newTax = Math.round(newTax * 1.04);
  oldTax = Math.round(oldTax * 1.04);

  const recommendedRegime = newTax <= oldTax ? "new" : "old";
  const taxSavings = Math.abs(oldTax - newTax);
  const advice = recommendedRegime === "new"
    ? `The New Tax Regime saves you ₹${taxSavings.toLocaleString()}/year. Even with standard tax deductions (80C, 80D) in the Old Regime, the lower tax slab rates in the New Regime yield better outcomes.`
    : `The Old Tax Regime saves you ₹${taxSavings.toLocaleString()}/year. Your investments and deductions under Section 80C/80D reduce your taxable income enough to make the Old Regime preferable.`;

  return {
    annualIncome,
    newRegimeTax: newTax,
    oldRegimeTax: oldTax,
    taxSavings,
    recommendedRegime,
    advice,
  };
}

/**
 * Calculates compounding wealth projection for a standard monthly SIP
 * and an annual Step-Up SIP (which grows by 10% each year).
 */
export function calculateSIPWealth(
  monthlySip: number,
  years: number,
  annualRate: number = 12
): {
  totalInvested: number;
  estimatedWealth: number;
  wealthGain: number;
  stepUpInvested: number;
  stepUpWealth: number;
  stepUpGain: number;
} {
  const months = years * 12;
  const monthlyRate = annualRate / 12 / 100;

  // Standard SIP Compounding Calculation
  let standardWealth = 0;
  let standardInvested = monthlySip * months;
  for (let i = 0; i < months; i++) {
    standardWealth = (standardWealth + monthlySip) * (1 + monthlyRate);
  }

  // Step-Up SIP Compounding (increases by 10% every 12 months)
  let stepUpWealth = 0;
  let stepUpInvested = 0;
  let currentSip = monthlySip;

  for (let month = 1; month <= months; month++) {
    stepUpWealth = (stepUpWealth + currentSip) * (1 + monthlyRate);
    stepUpInvested += currentSip;
    if (month % 12 === 0) {
      currentSip = currentSip * 1.10; // increase monthly contribution by 10%
    }
  }

  return {
    totalInvested: Math.round(standardInvested),
    estimatedWealth: Math.round(standardWealth),
    wealthGain: Math.round(Math.max(0, standardWealth - standardInvested)),
    stepUpInvested: Math.round(stepUpInvested),
    stepUpWealth: Math.round(stepUpWealth),
    stepUpGain: Math.round(Math.max(0, stepUpWealth - stepUpInvested)),
  };
}

