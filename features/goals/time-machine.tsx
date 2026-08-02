"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Sparkles, TrendingUp, PiggyBank, Landmark, Wallet } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePersonaStore } from "@/store/persona-store";
import { useExpensesStore } from "@/store/expenses-store";
import { useGoalsStore } from "@/store/goals-store";
import { formatLakh } from "@/lib/format";
import { projectFinancialFuture } from "@/lib/financial-projection";

const RETURN_RATE = 12; // annual return in percent

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

export function FinancialTimeMachine() {
  const profile = usePersonaStore((s) => s.profile);
  const goals = useGoalsStore((s) => s.goals);

  const [years, setYears] = useState(4);
  const [savedMonthly, setSavedMonthly] = useState(1500);
  const currentYear = new Date().getFullYear();

  const startInvested = useMemo(
    () => goals
      .filter((g) => g.type === "wealth-growth" || g.type === "retirement")
      .reduce((sum, g) => sum + g.currentAmount, 0),
    [goals]
  );

  const horizonMonths = years * 12;
  const income = profile.monthlyIncome || 75000;
  const spending = averageMonthlySpending();

  const points = useMemo(
    () =>
      projectFinancialFuture({
        monthlyIncome: income,
        monthlySpending: spending,
        annualReturn: RETURN_RATE / 100,
        horizonMonths,
        startInvested,
        scenarios: [{ id: "saving-boost", label: "Extra monthly saving", short: "saving", description: "", monthly: savedMonthly }],
      }),
    [income, spending, horizonMonths, startInvested, savedMonthly]
  );

  const today = points[0].value;
  const future = points[points.length - 1];
  const delta = future.value - today;
  const monthlyValue = income - spending;

  const statCards = [
    {
      label: `Projected balance by ${currentYear + years}`,
      value: formatLakh(future.value),
      icon: PiggyBank,
      positive: true,
    },
    {
      label: "Future value today",
      value: formatLakh(today),
      icon: Landmark,
      positive: today >= 0,
    },
    {
      label: "Growth from today",
      value: `${delta >= 0 ? "+" : ""}${formatLakh(delta)}`,
      icon: TrendingUp,
      positive: delta >= 0,
    },
    {
      label: "Monthly investable",
      value: formatLakh(monthlyValue) + "/mo",
      icon: Wallet,
      positive: monthlyValue >= 0,
    },
  ];

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Financial Time Machine
            </CardTitle>
            <CardDescription>
              Slide into the future and watch your savings, investments, and net worth compound in real time.
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-1 bg-primary/5 text-primary border-primary/20">
            <Sparkles className="h-3.5 w-3.5" />
            Current → {currentYear + years}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {statCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl border border-border bg-muted/30 p-3.5"
            >
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <s.icon className="h-3.5 w-3.5" />
                {s.label}
              </div>
              <p className={`mt-1 text-xl font-bold ${s.positive ? "text-foreground" : "text-destructive"}`}>
                {s.value}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
          <div className="flex items-center justify-between text-sm">
            <label className="font-medium text-foreground">Time horizon</label>
            <span className="font-semibold text-primary">Current → {currentYear + years}</span>
          </div>
          <input
            type="range"
            min="1"
            max="8"
            step="1"
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full accent-primary bg-secondary h-1.5 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Current</span>
            <span>{currentYear + 8}</span>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <label className="font-medium text-foreground">Extra savings/month</label>
            <span className="font-semibold text-primary">₹{savedMonthly.toLocaleString()} /mo</span>
          </div>
          <input
            type="range"
            min={0}
            max={10000}
            step={500}
            value={savedMonthly}
            onChange={(e) => setSavedMonthly(Number(e.target.value))}
            className="w-full accent-primary bg-secondary h-1.5 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>₹0</span>
            <span>₹10,000</span>
          </div>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="tmInvested" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.15} />
                </linearGradient>
                <linearGradient id="tmValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.15} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickMargin={6}
                interval={Math.max(0, Math.floor(points.length / 6))}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                width={46}
                tickFormatter={(v: number) => formatLakh(v, 0)}
              />
              <Tooltip
                formatter={(value: number | string, name: string) => [
                  formatLakh(typeof value === "number" ? value : Number(value)),
                  name === "invested" ? "Total invested" : "Projected value",
                ]}
                contentStyle={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area type="monotone" dataKey="invested" stroke="#ef4444" fill="url(#tmInvested)" strokeWidth={2} />
              <Area type="monotone" dataKey="value" stroke="#6366f1" fill="url(#tmValue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
          <p className="text-muted-foreground">
            If you keep investing <span className="font-semibold text-foreground">₹{monthlyValue.toLocaleString()}/mo</span> and
            your current corpus grows at <span className="font-semibold text-foreground">{RETURN_RATE}%</span> per year, by{" "}
            <span className="font-semibold text-foreground">{currentYear + years}</span> your wealth reaches{" "}
            <span className="font-bold text-primary">{formatLakh(future.value)}</span> —{" "}
            <span className="font-semibold text-foreground">
              {delta >= 0 ? "+" : ""}
              {formatLakh(delta)}
            </span>{" "}
            more than today.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}