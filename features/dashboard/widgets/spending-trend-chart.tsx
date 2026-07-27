"use client";

import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { formatCompactNumber, formatCurrency } from "@/lib/format";
import { useExpensesStore } from "@/store/expenses-store";
import { computeMonthlyTrend } from "@/lib/financial-engine";

export function SpendingTrendChart() {
  const transactions = useExpensesStore((s) => s.transactions);
  const data = computeMonthlyTrend(transactions);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending &amp; Savings Trend</CardTitle>
          <CardDescription>Last 6 months</CardDescription>
        </CardHeader>
        <CardContent className="flex h-72 items-center justify-center">
          <p className="text-sm text-muted-foreground">Add transactions to see your spending trend.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending &amp; Savings Trend</CardTitle>
        <CardDescription>Based on {transactions.length} transactions</CardDescription>
      </CardHeader>
      <CardContent className="h-72 pl-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="spending" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1E3A8A" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#1E3A8A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickFormatter={(v) => formatCompactNumber(v)} width={44} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--popover)", fontSize: 12 }} />
            <Area type="monotone" dataKey="spending" stroke="#1E3A8A" strokeWidth={2} fill="url(#spending)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
