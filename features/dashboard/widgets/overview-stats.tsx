"use client";

import { Wallet, TrendingDown, PiggyBank, HeartPulse } from "lucide-react";
import { StatTile } from "@/components/shared/stat-tile";
import { formatCurrency } from "@/lib/format";

export function OverviewStats() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile
        label="Net Worth"
        value={formatCurrency(1842600)}
        icon={Wallet}
        trend={{ value: "4.2%", direction: "up" }}
      />
      <StatTile
        label="Monthly Spending"
        value={formatCurrency(47900)}
        icon={TrendingDown}
        trend={{ value: "3.1%", direction: "up", positive: false }}
      />
      <StatTile
        label="Monthly Savings"
        value={formatCurrency(18700)}
        icon={PiggyBank}
        trend={{ value: "8.4%", direction: "up" }}
      />
      <StatTile
        label="Financial Health"
        value="82 / 100"
        icon={HeartPulse}
        trend={{ value: "5 pts", direction: "up" }}
      />
    </div>
  );
}
