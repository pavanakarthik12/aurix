"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, XCircle, CheckCircle } from "lucide-react";

interface QualityMetricCardProps {
  title: string;
  value: string;
  unit: string;
  trend?: "up" | "down" | "neutral";
  positive?: boolean;
}

interface QualityMetricState {
  title: string;
  value: string;
  unit: string;
  trend: "up" | "down" | "neutral";
  positive: boolean;
}

export function QualityMetricCard({ title, value, unit, trend = "neutral", positive = true }: QualityMetricCardProps) {
  const TrendIcon = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: CheckCircle,
  }[trend];

  const trendBg = {
    up: "bg-success/10 text-success",
    down: "bg-destructive/10 text-destructive",
    neutral: "bg-muted/10 text-muted-foreground",
  }[trend];

  return (
    <Card className="p-4 h-100">
      <div className="flex items-start gap-3">
        <Badge
          variant={positive ? (true ? "success" : "destructive") : "muted"}
          className="mt-1.5 h-1 w-1 rounded-full flex-shrink-0"
        >
          {positive ? <CheckCircle className="h-1.5 w-1.5" /> : <XCircle className="h-1.5 w-1.5" />}
        </Badge>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-foreground">{title}</div>
          <div className="text-2xl font-bold">
            {value} {unit}
          </div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t">
        <Progress
          value={positive && trend === "up" ? 80 : 30}
          className="h-1.5"
        />
        <div className="text-xs text-muted-foreground mt-1">
          {trend === "neutral" ? (
            "No directional trend"
          ) : (
            <>
              <TrendIcon className="h-3 w-3 inline mr-1" />
              {trend}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}