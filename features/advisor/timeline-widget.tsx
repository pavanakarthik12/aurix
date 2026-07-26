"use client";

import { motion } from "framer-motion";
import {
  Receipt,
  PiggyBank,
  Target,
  TrendingUp,
  FileText,
  ShoppingBag,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TimelineEvent } from "@/types/finance";

interface TimelineWidgetProps {
  events: TimelineEvent[];
}

const EVENT_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  expense: { icon: Receipt, color: "text-red-500", bg: "bg-red-500/10" },
  savings: { icon: PiggyBank, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  goal: { icon: Target, color: "text-blue-500", bg: "bg-blue-500/10" },
  investment: { icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-500/10" },
  bill: { icon: FileText, color: "text-amber-500", bg: "bg-amber-500/10" },
  purchase: { icon: ShoppingBag, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  payment: { icon: ArrowRight, color: "text-orange-500", bg: "bg-orange-500/10" },
};

function formatDate(date: string) {
  const d = new Date(date);
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(d);
}

export function FinancialTimeline({ events }: TimelineWidgetProps) {
  const sorted = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Timeline</CardTitle>
        <CardDescription>Your financial activity at a glance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-0">
          <div className="absolute bottom-0 left-[17px] top-0 w-px bg-border" />
          {sorted.map((event, i) => {
            const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.expense;
            const Icon = config.icon;
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="relative flex gap-4 pb-5 last:pb-0"
              >
                <div className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${config.bg}`}>
                  <Icon className={`h-4 w-4 ${config.color}`} />
                </div>
                <div className="min-w-0 flex-1 pt-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{event.title}</p>
                      {event.description && (
                        <p className="text-xs text-muted-foreground">{event.description}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(event.amount)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{formatDate(event.date)}</p>
                    </div>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    {event.category && (
                      <Badge variant="muted" className="text-[10px]">{event.category}</Badge>
                    )}
                    {event.status && (
                      <Badge
                        variant={event.status === "completed" ? "success" : event.status === "upcoming" ? "default" : "destructive"}
                        className="text-[10px]"
                      >
                        {event.status === "overdue" && <AlertCircle className="mr-1 h-3 w-3" />}
                        {event.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
