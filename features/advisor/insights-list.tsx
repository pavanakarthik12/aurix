"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  AlertCircle,
  Coffee,
  Car,
  Repeat,
  ShoppingBag,
  Crosshair,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AIInsight } from "@/types/finance";

interface InsightsListProps {
  insights: AIInsight[];
}

const INSIGHT_ICONS: Record<string, React.ElementType> = {
  spending: TrendingUp,
  savings: TrendingDown,
  subscription: Repeat,
  pattern: ShoppingBag,
  anomaly: Crosshair,
};

const SEVERITY_STYLES: Record<string, { badge: "warning" | "destructive" | "default"; icon: string }> = {
  info: { badge: "default", icon: "text-primary" },
  warning: { badge: "warning", icon: "text-warning" },
  critical: { badge: "destructive", icon: "text-destructive" },
};

export function InsightsList({ insights }: InsightsListProps) {
  const Icon = INSIGHT_ICONS[insights[0]?.type] || Info;

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Spending Insights</CardTitle>
        <CardDescription>Natural language insights about your finances</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, i) => {
          const sev = SEVERITY_STYLES[insight.severity] || SEVERITY_STYLES.info;
          const TypeIcon = INSIGHT_ICONS[insight.type] || Info;
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="group flex gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent"
            >
              <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted ${sev.icon}`}>
                <TypeIcon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{insight.title}</p>
                  <Badge variant={sev.badge} className="shrink-0 text-[10px]">
                    {insight.severity}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{insight.description}</p>
                {insight.metric && (
                  <div className="mt-1.5 flex items-center gap-1 text-xs font-medium">
                    {insight.metric.direction === "up" ? (
                      <TrendingUp className={`h-3 w-3 ${insight.metric.positive ? "text-success" : "text-destructive"}`} />
                    ) : (
                      <TrendingDown className={`h-3 w-3 ${insight.metric.positive ? "text-success" : "text-destructive"}`} />
                    )}
                    <span className={insight.metric.positive ? "text-success" : "text-destructive"}>
                      {insight.metric.value}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
