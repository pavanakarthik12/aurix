"use client";

import * as React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    direction: "up" | "down";
    positive?: boolean;
  };
  className?: string;
}

export function StatTile({ label, value, icon: Icon, trend, className }: StatTileProps) {
  const trendIsGood =
    trend && (trend.positive ?? trend.direction === "up");

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
    >
      <Card className={cn("p-5", className)}>
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {value}
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4.5 w-4.5" />
          </div>
        </div>
        {trend && (
          <div
            className={cn(
              "mt-3 inline-flex items-center gap-1 text-xs font-medium",
              trendIsGood ? "text-success" : "text-destructive"
            )}
          >
            {trend.direction === "up" ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {trend.value}
            <span className="font-normal text-muted-foreground">vs last month</span>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
