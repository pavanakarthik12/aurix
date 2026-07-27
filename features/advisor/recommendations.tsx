"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  CreditCard,
  Target,
  Wallet,
  Repeat,
  ChevronRight,
  BookOpen,
  Calculator,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { AIRecommendation } from "@/types/finance";

interface RecommendationsListProps {
  recommendations: AIRecommendation[];
}

const CATEGORY_MAP: Record<string, { icon: React.ElementType; label: string }> = {
  savings: { icon: PiggyBank, label: "Savings" },
  spending: { icon: CreditCard, label: "Spending" },
  investment: { icon: TrendingUp, label: "Investment" },
  debt: { icon: Wallet, label: "Debt" },
  budget: { icon: Target, label: "Budget" },
  subscription: { icon: Repeat, label: "Subscription" },
};

const IMPACT_STYLES: Record<string, "destructive" | "warning" | "secondary"> = {
  high: "destructive",
  medium: "warning",
  low: "secondary",
};

export function RecommendationsList({ recommendations }: RecommendationsListProps) {
  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Recommendations</CardTitle>
          <CardDescription>Top personalized actions for this month</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Add more transactions and financial goals to get personalized recommendations.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Recommendations</CardTitle>
        <CardDescription>Top personalized actions for this month</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((rec, i) => {
          const cat = CATEGORY_MAP[rec.category] || CATEGORY_MAP.budget;
          const CatIcon = cat.icon;
          return (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="group rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CatIcon className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{rec.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{rec.description}</p>
                    </div>
                    <Badge variant={IMPACT_STYLES[rec.impact]} className="shrink-0 text-[10px]">
                      {rec.impact}
                    </Badge>
                  </div>

                  {rec.evidence && rec.evidence.length > 0 && (
                    <div className="mt-2 space-y-1 rounded-md bg-surface-muted p-2">
                      <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground mb-1">
                        <Calculator className="h-3 w-3" />
                        Evidence
                      </div>
                      {rec.evidence.map((e, ei) => (
                        <div key={ei} className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">{e.label}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-foreground">{e.currentValue}</span>
                            {e.direction !== "neutral" && (
                              e.direction === "up" ? (
                                <TrendingUp className={`h-3 w-3 ${e.positive ? "text-success" : "text-destructive"}`} />
                              ) : (
                                <TrendingDown className={`h-3 w-3 ${e.positive ? "text-success" : "text-destructive"}`} />
                              )
                            )}
                            <span className={`text-[10px] ${e.positive ? "text-success" : "text-destructive"}`}>
                              {e.difference}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {rec.whyItMatters && (
                    <div className="mt-1.5 flex items-start gap-1 text-[11px] text-muted-foreground">
                      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                      <span>{rec.whyItMatters}</span>
                    </div>
                  )}

                  <div className="mt-2 flex flex-wrap gap-2">
                    {rec.potentialSavings > 0 && (
                      <Badge variant="success" className="gap-1 text-[10px]">
                        <PiggyBank className="h-3 w-3" />
                        ₹{(rec.potentialSavings / 1000).toFixed(1)}K/yr
                      </Badge>
                    )}
                    {rec.annualSavings && rec.annualSavings > 0 && (
                      <Badge variant="success" className="gap-1 text-[10px]">
                        <CheckCircle2 className="h-3 w-3" />
                        ₹{(rec.annualSavings / 1000).toFixed(1)}K/yr savings
                      </Badge>
                    )}
                    {rec.expectedResult && (
                      <Badge variant="outline" className="gap-1 text-[10px]">
                        <Target className="h-3 w-3" />
                        {rec.expectedResult}
                      </Badge>
                    )}
                    {rec.sourceBook && (
                      <Badge variant="outline" className="gap-1 text-[10px]">
                        <BookOpen className="h-3 w-3" />
                        {rec.sourceBook}
                      </Badge>
                    )}
                    <Badge variant="muted" className="text-[10px]">
                      {rec.confidence}% confidence
                    </Badge>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
