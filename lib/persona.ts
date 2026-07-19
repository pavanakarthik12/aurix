import type { FinancialGoalType, FinancialPersona, OnboardingProfile, RiskAppetite } from "@/types/finance";

const RISK_LABELS: Record<RiskAppetite, string> = {
  conservative: "Conservative Risk",
  moderate: "Moderate Risk",
  aggressive: "Growth-Focused Risk",
};

const GOAL_TRAITS: Record<FinancialGoalType, string> = {
  "emergency-fund": "Emergency Fund Focus",
  "debt-payoff": "Debt-Free Mindset",
  "wealth-growth": "Long-Term Thinker",
  "home-purchase": "Milestone Planner",
  retirement: "Future-Focused Planner",
  travel: "Balanced Lifestyle Spender",
};

function savingsRate(profile: OnboardingProfile) {
  if (!profile.monthlyIncome || !profile.monthlySavings) return 0;
  return profile.monthlySavings / profile.monthlyIncome;
}

export function derivePersona(profile: OnboardingProfile): FinancialPersona {
  const rate = savingsRate(profile);
  const risk = profile.riskAppetite ?? "moderate";
  const goal = profile.financialGoal ?? "wealth-growth";

  let title = "The Strategic Saver";
  if (rate >= 0.3 && risk === "conservative") title = "The Disciplined Guardian";
  else if (rate >= 0.3) title = "The Strategic Saver";
  else if (rate >= 0.15) title = "The Steady Builder";
  else if (risk === "aggressive") title = "The Bold Investor";
  else title = "The Mindful Spender";

  const traits = [
    rate >= 0.2 ? "Strong Budget Discipline" : "Building Savings Habits",
    GOAL_TRAITS[goal],
    risk === "aggressive" ? "Comfortable with Volatility" : "Values Financial Stability",
  ];

  return {
    title,
    archetype: title,
    riskLabel: RISK_LABELS[risk],
    traits,
    summary: `Based on your ${
      profile.monthlyIncome ? "income and savings pattern" : "responses"
    }, you show a ${RISK_LABELS[risk].toLowerCase()} profile with a focus on ${GOAL_TRAITS[
      goal
    ].toLowerCase()}.`,
  };
}
