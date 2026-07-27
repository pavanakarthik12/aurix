"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  HeartPulse, TrendingUp, TrendingDown, Minus, Info, Lightbulb,
  BarChart3, RefreshCw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useExpensesStore } from "@/store/expenses-store";
import { useGoalsStore } from "@/store/goals-store";
import {
  autoRecalculateHealthScore, computeHealthHistory, MonthlyHealthSnapshot,
} from "@/lib/financial-engine";
import type { FinancialHealthScore } from "@/types/finance";

const FACTOR_LABELS: Record<string, string> = {
  savingsRate: "Savings Rate",
  budgetAdherence: "Budget Adherence",
  goalProgress: "Goal Progress",
  cashFlow: "Cash Flow",
};

const FACTOR_DESCRIPTIONS: Record<string, string> = {
  savingsRate: "Percentage of income saved each month",
  budgetAdherence: "How well you stick to your budget",
  goalProgress: "Progress on financial goals",
  cashFlow: "Monthly income minus expenses",
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
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color}
          strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference}
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

export function HealthScoreCard({ score: initialScore }: { score?: FinancialHealthScore }) {
  const transactions = useExpensesStore((s) => s.transactions);
  const goals = useGoalsStore((s) => s.goals);
  const [income] = useState(() => {
    if (typeof window === "undefined") return 75000;
    try { return parseInt(localStorage.getItem("aurix-income") || "75000"); } catch { return 75000; }
  });

  const autoScore = useMemo(
    () => autoRecalculateHealthScore(transactions, goals, income),
    [transactions, goals, income]
  );

  const healthHistory = useMemo(
    () => computeHealthHistory(transactions, goals, income),
    [transactions, goals, income]
  );

  const score = initialScore || {
    overall: autoScore.overall,
    savingsRate: autoScore.savingsRate,
    budgetAdherence: autoScore.budgetAdherence,
    goalProgress: autoScore.goalProgress,
    cashFlow: autoScore.cashFlow,
    explanation: autoScore.explanation,
    recommendations: autoScore.recommendations,
    trend: (healthHistory.length >= 2 && healthHistory[healthHistory.length - 1].overall > healthHistory[healthHistory.length - 2].overall
      ? "up" as const
      : healthHistory.length >= 2 && healthHistory[healthHistory.length - 1].overall < healthHistory[healthHistory.length - 2].overall
        ? "down" as const
        : "stable" as const),
    change: healthHistory.length >= 2
      ? healthHistory[healthHistory.length - 1].overall - healthHistory[healthHistory.length - 2].overall
      : 0,
  };

  const TrendIcon = score.trend === "up" ? TrendingUp : score.trend === "down" ? TrendingDown : Minus;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Financial Health Score</CardTitle>
          <CardDescription>Auto-calculated from {transactions.length} transactions · recalculates on change</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {healthHistory.length >= 2 && (
            <Badge variant="outline" className="gap-1 text-[10px]">
              <BarChart3 className="h-3 w-3" />
              {healthHistory.length}mo history
            </Badge>
          )}
          <Badge variant={score.trend === "up" ? "success" : score.trend === "down" ? "destructive" : "muted"} className="gap-1">
            <TrendIcon className="h-3 w-3" />
            {score.change > 0 ? "+" : ""}{score.change}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-6">
          <CircularScore value={score.overall} />
          <div className="space-y-2 text-center sm:text-left">
            <p className="text-sm leading-relaxed text-muted-foreground">{score.explanation}</p>
            <div className="flex flex-wrap gap-1.5">
              {score.recommendations.slice(0, 3).map((rec, i) => (
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

        {healthHistory.length >= 2 && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Monthly Progress</p>
            <div className="flex items-end gap-1.5">
              {healthHistory.slice(-6).map((h, i) => {
                const height = Math.max(8, (h.overall / 100) * 64);
                const color = h.overall >= 80 ? "bg-success" : h.overall >= 60 ? "bg-warning" : "bg-destructive";
                return (
                  <Tooltip key={h.month}>
                    <TooltipTrigger asChild>
                      <div className="flex flex-1 flex-col items-center gap-1">
                        <div
                          className={`w-full rounded-sm ${color} transition-all`}
                          style={{ height }}
                        />
                        <span className="text-[9px] text-muted-foreground">{h.month.split(" ")[0]}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      {h.month}: {h.overall}/100
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
