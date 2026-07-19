import Link from "next/link";
import { ArrowRight, UtensilsCrossed, Car, Clapperboard, Zap, ShoppingBag, HeartPulse, Home, MoreHorizontal } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MOCK_TRANSACTIONS, CATEGORY_LABELS } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ExpenseCategory } from "@/types/finance";

const CATEGORY_ICONS: Record<ExpenseCategory, LucideIcon> = {
  food: UtensilsCrossed,
  transport: Car,
  entertainment: Clapperboard,
  utilities: Zap,
  shopping: ShoppingBag,
  health: HeartPulse,
  housing: Home,
  other: MoreHorizontal,
};

export function RecentTransactions() {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest activity across your accounts</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/expenses">
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {MOCK_TRANSACTIONS.map((tx) => {
            const Icon = CATEGORY_ICONS[tx.category];
            return (
              <li key={tx.id} className="flex items-center gap-3 px-6 py-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{tx.merchant}</p>
                  <p className="text-xs text-muted-foreground">
                    {CATEGORY_LABELS[tx.category]} · {formatDate(tx.date)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-foreground">
                  −{formatCurrency(tx.amount)}
                </p>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
