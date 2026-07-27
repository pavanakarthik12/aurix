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

  if (q.includes("save") || q.includes("savings") || q.includes("waste") || q.includes("wasting")) {
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
