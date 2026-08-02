"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlaskConical, Sparkles, Check, Zap } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePersonaStore } from "@/store/persona-store";
import { useExpensesStore } from "@/store/expenses-store";
import { formatLakh } from "@/lib/format";
import {
  projectFinancialFuture,
  DEFAULT_SCENARIOS,
  type ProjectionPoint,
  type WhatIfScenario,
} from "@/lib/financial-projection";

const HORIZON_YEARS = 6;

function averageMonthlySpending(): number {
  const transactions = useExpensesStore.getState().transactions;
  const byMonth: Record<string, number> = {};
  for (const tx of transactions) {
    const d = new Date(tx.date);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    byMonth[key] = (byMonth[key] || 0) + tx.amount;
  }
  const totals = Object.values(byMonth);
  return totals.length > 0 ? totals.reduce((a, b) => a + b, 0) / totals.length : 47900;
}

function mergePoints(
  a: ProjectionPoint[],
  b: ProjectionPoint[]
): { label: string; baseline: number; scenario: number }[] {
  return a.map((pa, i) => ({
    label: pa.label,
    baseline: pa.value,
    scenario: b[i]?.value ?? pa.value,
  }));
}

export function WhatIfSimulator() {
  const profile = usePersonaStore((s) => s.profile);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [savedMonthly, setSavedMonthly] = useState(0);

  const currentYear = new Date().getFullYear();
  const targetYear = currentYear + HORIZON_YEARS;
  const income = profile.monthlyIncome || 75000;
  const spending = averageMonthlySpending();

  const activeScenarios = useMemo<WhatIfScenario[]>(
    () => DEFAULT_SCENARIOS.filter((s) => enabled[s.id]),
    [enabled]
  );

  const baselinePoints = useMemo(
    () =>
      projectFinancialFuture({
        monthlyIncome: income,
        monthlySpending: spending,
        annualReturn: 0.12,
        horizonMonths: HORIZON_YEARS,
      }),
    [income, spending]
  );

  const scenarioPoints = useMemo(
    () =>
      projectFinancialFuture({
        monthlyIncome: income,
        monthlySpending: spending,
        annualReturn: 0.12,
        horizonMonths: HORIZON_YEARS,
        scenarios: activeScenarios.length || savedMonthly > 0
          ? [...activeScenarios, { id: "custom", label: "custom", short: "custom", description: "", monthly: savedMonthly }]
          : undefined,
      }),
    [income, spending, activeScenarios, savedMonthly]
  );

  const baselineLast = baselinePoints[baselinePoints.length - 1];
  const scenarioLast = scenarioPoints[scenarioPoints.length - 1];
  const delta = scenarioLast.value - baselineLast.value;
  const toggledCount = activeScenarios.length;

  const chartData = useMemo(() => mergePoints(baselinePoints, scenarioPoints), [baselinePoints, scenarioPoints]);

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              &ldquo;What If?&rdquo; Simulator
            </CardTitle>
            <CardDescription>
              Toggle real-life changes and watch your future balance, savings, and goal completion recalculate instantly.
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-1 bg-emerald-500/5 text-emerald-500 border-emerald-500/20">
            <Zap className="h-3.5 w-3.5" />
            By {targetYear}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DEFAULT_SCENARIOS.map((scenario) => {
            const active = !!enabled[scenario.id];
            return (
              <button
                key={scenario.id}
                type="button"
                onClick={() =>
                  setEnabled((prev) => ({ ...prev, [scenario.id]: !prev[scenario.id] }))
                }
                className={`group relative flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition-colors ${
                  active
                    ? "border-primary/40 bg-primary/10"
                    : "border-border bg-muted/30 hover:bg-muted/50"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{scenario.short}</span>
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-transparent"
                    }`}
                  >
                    <Check className="h-3 w-3" />
                  </span>
                </div>
                <p className="text-[11px] leading-snug text-muted-foreground">{scenario.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {(scenario.oneTime ?? 0) !== 0 && (
                    <Badge variant="secondary" className="text-[10px]">
                      {(scenario.oneTime ?? 0) > 0 ? "+" : ""}
                      {formatLakh(scenario.oneTime ?? 0)} one-time
                    </Badge>
                  )}
                  {scenario.monthly !== 0 && (
                    <Badge
                      variant={scenario.monthly >= 0 ? "success" : "destructive"}
                      className="text-[10px]"
                    >
                      {scenario.monthly >= 0 ? "+" : ""}
                      ₹{Math.abs(scenario.monthly).toLocaleString()}/mo
                    </Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
          <div className="flex items-center justify-between text-sm">
            <label className="font-medium text-foreground">Custom monthly saving top-up</label>
            <span className="font-semibold text-primary">
              {savedMonthly > 0 ? "+" : ""}₹{savedMonthly.toLocaleString()}/mo
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={20000}
            step={500}
            value={savedMonthly}
            onChange={(e) => setSavedMonthly(Number(e.target.value))}
            className="w-full accent-primary bg-secondary h-1.5 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>₹0</span>
            <span>₹20,000</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${toggledCount}-${savedMonthly}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className={`flex items-center justify-between gap-4 rounded-xl border p-4 ${
              delta >= 0 ? "border-emerald-500/25 bg-emerald-500/5" : "border-rose-500/25 bg-rose-500/5"
            }`}
          >
            <div>
              <p className="text-xs text-muted-foreground">Projected wealth by {targetYear}</p>
              <p className="text-3xl font-bold text-foreground">
                {toggledCount > 0 || savedMonthly > 0 ? formatLakh(scenarioLast.value) : formatLakh(baselineLast.value)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">vs. doing nothing</p>
              <p className={`text-2xl font-bold ${delta >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                {delta >= 0 ? "+" : ""}
                {formatLakh(delta)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {delta >= 0 ? "extra wealth" : "cash you'd tie up"}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="wiBaseline" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="wiScenario" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.85} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickMargin={6}
                interval={Math.max(0, Math.floor(chartData.length / 6))}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                width={46}
                tickFormatter={(v: number) => formatLakh(v, 0)}
              />
              <Tooltip
                formatter={(value: number | string, name: string) => [
                  formatLakh(typeof value === "number" ? value : Number(value)),
                  name === "baseline" ? "Doing nothing" : "With changes",
                ]}
                contentStyle={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="baseline" stroke="#94a3b8" fill="url(#wiBaseline)" strokeWidth={2} strokeDasharray="4 3" />
              <Area type="monotone" dataKey="scenario" stroke="#6366f1" fill="url(#wiScenario)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}