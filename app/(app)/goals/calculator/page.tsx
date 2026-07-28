"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calculator, Percent, Sparkles, TrendingUp, ShieldAlert, Award } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { calculateIndianTax, calculateSIPWealth } from "@/lib/financial-engine";

export default function CalculatorPage() {
  const [monthlyIncome, setMonthlyIncome] = useState(150000);
  const [monthlySip, setMonthlySip] = useState(10000);
  const [years, setYears] = useState(15);

  const tax = calculateIndianTax(monthlyIncome);
  const sip = calculateSIPWealth(monthlySip, years, 12);

  const maxTax = Math.max(tax.oldRegimeTax, tax.newRegimeTax, 1);
  const oldRegimePercent = (tax.oldRegimeTax / maxTax) * 100;
  const newRegimePercent = (tax.newRegimeTax / maxTax) * 100;

  const maxSip = Math.max(sip.stepUpWealth, sip.estimatedWealth, 1);
  const standardSipPercent = (sip.estimatedWealth / maxSip) * 100;
  const stepUpSipPercent = (sip.stepUpWealth / maxSip) * 100;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" asChild>
          <Link href="/goals">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-xl font-bold text-foreground">Indian Tax & SIP Compounding Calculator</h2>
          <p className="text-sm text-muted-foreground">Plan your regime savings and wealth projection with interactive tools</p>
        </div>
      </div>

      {/* Control Sliders */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Interactive Parameters
          </CardTitle>
          <CardDescription>Adjust sliders to see tax and investment returns update instantly.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">Monthly Income</label>
              <span className="text-sm font-semibold text-foreground">₹{monthlyIncome.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="20000"
              max="500000"
              step="5000"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(Number(e.target.value))}
              className="w-full accent-primary bg-secondary h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>₹20K</span>
              <span>₹5L</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">Monthly SIP</label>
              <span className="text-sm font-semibold text-foreground">₹{monthlySip.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="500"
              max="100000"
              step="500"
              value={monthlySip}
              onChange={(e) => setMonthlySip(Number(e.target.value))}
              className="w-full accent-primary bg-secondary h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>₹500</span>
              <span>₹100K</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">Horizon (Years)</label>
              <span className="text-sm font-semibold text-foreground">{years} Years</span>
            </div>
            <input
              type="range"
              min="1"
              max="35"
              step="1"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full accent-primary bg-secondary h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>1 Yr</span>
              <span>35 Yrs</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Tax Slab Card */}
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">Tax Regime Comparison</CardTitle>
                <CardDescription>FY 2024-25 old vs new regime rules</CardDescription>
              </div>
              <Badge variant="outline" className="gap-1 bg-primary/5 text-primary border-primary/20">
                <Percent className="h-3.5 w-3.5" />
                Regime Analysis
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex gap-3">
              <Award className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Recommended: {tax.recommendedRegime.toUpperCase()} REGIME
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  You will save ₹{tax.taxSavings.toLocaleString()}/year under this regime!
                </p>
              </div>
            </div>

            {/* Visual Bar Chart */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-foreground">New Tax Regime</span>
                  <span className="text-muted-foreground">₹{tax.newRegimeTax.toLocaleString()}/yr</span>
                </div>
                <div className="w-full bg-secondary h-4 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${newRegimePercent}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-foreground">Old Tax Regime</span>
                  <span className="text-muted-foreground">₹{tax.oldRegimeTax.toLocaleString()}/yr</span>
                </div>
                <div className="w-full bg-secondary h-4 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${oldRegimePercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4 text-xs text-muted-foreground leading-relaxed flex gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>{tax.advice}</span>
            </div>
          </CardContent>
        </Card>

        {/* SIP Compounding Card */}
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">SIP Compounding Growth</CardTitle>
                <CardDescription>Projected wealth at 12% annual return</CardDescription>
              </div>
              <Badge variant="outline" className="gap-1 bg-emerald-500/5 text-emerald-500 border-emerald-500/20">
                <TrendingUp className="h-3.5 w-3.5" />
                12% Compound
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex gap-3">
              <Sparkles className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Step-Up SIP Advantage
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Increasing your SIP by 10% annually creates an extra ₹{(sip.stepUpWealth - sip.estimatedWealth).toLocaleString()}!
                </p>
              </div>
            </div>

            {/* Visual Bar Chart */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-foreground">10% Step-Up SIP Wealth</span>
                  <span className="text-muted-foreground">₹{sip.stepUpWealth.toLocaleString()}</span>
                </div>
                <div className="w-full bg-secondary h-4 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${stepUpSipPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                  <span>Invested: ₹{sip.stepUpInvested.toLocaleString()}</span>
                  <span>Gain: ₹{sip.stepUpGain.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-foreground">Standard SIP Wealth</span>
                  <span className="text-muted-foreground">₹{sip.estimatedWealth.toLocaleString()}</span>
                </div>
                <div className="w-full bg-secondary h-4 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${standardSipPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                  <span>Invested: ₹{sip.totalInvested.toLocaleString()}</span>
                  <span>Gain: ₹{sip.wealthGain.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
