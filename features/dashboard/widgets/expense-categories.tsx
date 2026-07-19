"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CATEGORY_LABELS, EXPENSE_BREAKDOWN } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/format";

const COLORS = ["#1E3A8A", "#10B981", "#3B5BDB", "#F59E0B", "#6B7280", "#22C55E", "#EF4444", "#93A5F5"];

export function ExpenseCategories() {
  const total = EXPENSE_BREAKDOWN.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Categories</CardTitle>
        <CardDescription>This month · {formatCurrency(total)}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="h-48 w-full sm:w-48 sm:shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={EXPENSE_BREAKDOWN}
                  dataKey="amount"
                  nameKey="category"
                  innerRadius={54}
                  outerRadius={80}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {EXPENSE_BREAKDOWN.map((entry, index) => (
                    <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, _name, item) => [
                    formatCurrency(Number(value)),
                    CATEGORY_LABELS[
                      item.payload.category as keyof typeof CATEGORY_LABELS
                    ],
                  ]}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--popover)",
                    color: "var(--popover-foreground)",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="flex-1 space-y-2.5">
            {EXPENSE_BREAKDOWN.map((item, index) => (
              <li key={item.category} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  {CATEGORY_LABELS[item.category]}
                </span>
                <span className="font-medium text-foreground">
                  {formatCurrency(item.amount)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
