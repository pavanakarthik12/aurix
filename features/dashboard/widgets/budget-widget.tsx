import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/format";

const BUDGETS = [
  { label: "Food & Dining", spent: 9600, limit: 12000 },
  { label: "Shopping", spent: 7300, limit: 8000 },
  { label: "Transport", spent: 4200, limit: 6000 },
  { label: "Entertainment", spent: 2100, limit: 3000 },
];

export function BudgetWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Budget</CardTitle>
        <CardDescription>Tracked against your set limits</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {BUDGETS.map((b) => {
          const pct = Math.min(100, Math.round((b.spent / b.limit) * 100));
          const nearLimit = pct >= 90;
          return (
            <div key={b.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{b.label}</span>
                <span className="text-muted-foreground">
                  {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                </span>
              </div>
              <Progress
                value={pct}
                indicatorClassName={nearLimit ? "bg-warning" : undefined}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
