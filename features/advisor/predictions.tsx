"use client";

import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle, BarChart3, Target } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { PredictionResult } from "@/types/finance";

interface PredictionsWidgetProps {
  predictions: PredictionResult[];
}

export function PredictionsWidget({ predictions }: PredictionsWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Predictive Insights</CardTitle>
        <CardDescription>AI-powered projections for the next 3 months</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {predictions.map((pred, i) => (
          <motion.div
            key={pred.month}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">{pred.month}</p>
              <Badge variant="outline" className="text-[10px]">
                <BarChart3 className="mr-1 h-3 w-3" />
                {pred.confidence}% confidence
              </Badge>
            </div>

            <div className="mb-3 grid grid-cols-3 gap-3">
              <div>
                <p className="text-[11px] text-muted-foreground">Expenses</p>
                <p className="text-sm font-semibold text-foreground">
                  {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(pred.predictedExpenses)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Savings</p>
                <p className="text-sm font-semibold text-foreground">
                  {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(pred.predictedSavings)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Cash Flow</p>
                <p className={`text-sm font-semibold ${pred.cashFlow >= 0 ? "text-success" : "text-destructive"}`}>
                  {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(pred.cashFlow)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Goal Completion</span>
                <span className="font-medium text-foreground">{pred.goalCompletionPercent}%</span>
              </div>
              <Progress value={pred.goalCompletionPercent} className="h-1.5" />
            </div>

            {pred.budgetOverflow && (
              <div className="mt-2 flex items-center gap-1.5 rounded-md bg-destructive/10 px-2.5 py-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                <span className="text-xs text-destructive">Budget overflow predicted — review spending plan</span>
              </div>
            )}
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}
