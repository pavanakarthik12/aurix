"use client";

import { motion } from "framer-motion";
import { HeartPulse, TrendingUp, TrendingDown, Minus, Info, Lightbulb } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { FinancialHealthScore } from "@/types/finance";

interface HealthScoreProps {
  score: FinancialHealthScore;
}

const FACTOR_LABELS: Record<string, string> = {
  savingsRate: "Savings Rate",
  debtRatio: "Debt Ratio",
  emergencyFund: "Emergency Fund",
  expenseStability: "Expense Stability",
  budgetAdherence: "Budget Adherence",
  goalProgress: "Goal Progress",
  incomeGrowth: "Income Growth",
  investmentRatio: "Investment Ratio",
};

const FACTOR_DESCRIPTIONS: Record<string, string> = {
  savingsRate: "Percentage of income saved each month",
  debtRatio: "Debt-to-income ratio health",
  emergencyFund: "Progress toward 6-month emergency fund",
  expenseStability: "Consistency of monthly expenses",
  budgetAdherence: "How well you stick to your budget",
  goalProgress: "Progress on financial goals",
  incomeGrowth: "Income trend over time",
  investmentRatio: "Percentage of income invested",
};

function CircularScore({ value, size = 140 }: { value: number; size?: number }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const color = value >= 80 ? "#22c55e" : value >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold tracking-tight text-foreground">{value}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

export function HealthScoreCard({ score }: HealthScoreProps) {
  const TrendIcon = score.trend === "up" ? TrendingUp : score.trend === "down" ? TrendingDown : Minus;
  const trendColor = score.trend === "up" ? "text-success" : score.trend === "down" ? "text-destructive" : "text-muted-foreground";

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Financial Health Score</CardTitle>
          <CardDescription>Overall assessment of your financial wellbeing</CardDescription>
        </div>
        <Badge variant={score.trend === "up" ? "success" : score.trend === "down" ? "destructive" : "muted"} className="gap-1">
          <TrendIcon className="h-3 w-3" />
          {score.change > 0 ? "+" : ""}{score.change}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-6">
          <CircularScore value={score.overall} />
          <div className="space-y-2 text-center sm:text-left">
            <p className="text-sm leading-relaxed text-muted-foreground">{score.explanation}</p>
            <div className="flex flex-wrap gap-1.5">
              {score.recommendations.slice(0, 2).map((rec, i) => (
                <Badge key={i} variant="secondary" className="text-[10px]">
                  <Lightbulb className="mr-1 h-3 w-3" />
                  {rec}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(FACTOR_LABELS).map(([key, label]) => {
            const val = score[key as keyof typeof score] as number;
            if (typeof val !== "number") return null;
            const factorColor = val >= 80 ? "text-success" : val >= 60 ? "text-warning" : "text-destructive";
            return (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <div className="rounded-lg border border-border bg-surface-muted p-3 text-left">
                    <p className="truncate text-[11px] text-muted-foreground">{label}</p>
                    <p className={`text-lg font-semibold ${factorColor}`}>{val}</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-48 text-xs">
                  {FACTOR_DESCRIPTIONS[key] || label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function HealthScoreSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-5 w-44 animate-pulse rounded bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="h-36 w-36 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
