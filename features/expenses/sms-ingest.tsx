"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Clipboard, Plus, Check } from "lucide-react";
import { toast } from "sonner";
import { useExpensesStore } from "@/store/expenses-store";
import type { ExpenseCategory } from "@/types/finance";

export function SMSIngest() {
  const [smsText, setSmsText] = useState("");
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState<ExpenseCategory>("food");
  const [parsed, setParsed] = useState(false);

  const addTransaction = useExpensesStore((state) => state.addTransaction);

  const parseSMS = () => {
    if (!smsText.trim()) {
      toast.error("Please paste an SMS message first");
      return;
    }

    const text = smsText.toLowerCase();

    // 1. Parse Amount (Indian SMS formats typically: Rs. XXX, Rs XXX, INR XXX)
    let parsedAmount = "";
    const amountRegexes = [
      /(?:rs\.?|inr|amt)\s*([\d,]+\.?\d*)/i,
      /spent\s*rs\.?\s*([\d,]+\.?\d*)/i,
      /debited\s*(?:by|with)?\s*rs\.?\s*([\d,]+\.?\d*)/i,
    ];

    for (const regex of amountRegexes) {
      const match = smsText.match(regex);
      if (match) {
        parsedAmount = match[1].replace(/,/g, "");
        break;
      }
    }

    // 2. Parse Merchant
    let parsedMerchant = "";
    const merchantRegexes = [
      /(?:at|to|on)\s+([A-Za-z0-9\s*#_]+?)(?:\s+using|\s+card|\s+on|\s+at|\s+balance|\s+ref|\s+link|\.)/i,
      /debited\s+for\s+([A-Za-z0-9\s*#_]+?)(?:\s+using|\s+on|\.)/i,
      /transfer\s+to\s+([A-Za-z0-9\s*#_]+?)(?:\s+ref|\s+on|\.)/i,
    ];

    for (const regex of merchantRegexes) {
      const match = smsText.match(regex);
      if (match) {
        parsedMerchant = match[1].trim();
        break;
      }
    }

    // Clean up parsed merchant (capitalization, removing extra spaces)
    if (parsedMerchant) {
      parsedMerchant = parsedMerchant
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    } else {
      parsedMerchant = "Unknown Merchant";
    }

    // 3. Simple Category Heuristics
    let parsedCategory: ExpenseCategory = "other";
    const lowercaseMerchant = parsedMerchant.toLowerCase();
    if (lowercaseMerchant.match(/swiggy|zomato|social|restaurant|starbucks|cafe|food/)) {
      parsedCategory = "food";
    } else if (lowercaseMerchant.match(/uber|ola|metro|bus|petrol|fuel/)) {
      parsedCategory = "transport";
    } else if (lowercaseMerchant.match(/amazon|flipkart|myntra|shopping|decathlon/)) {
      parsedCategory = "shopping";
    } else if (lowercaseMerchant.match(/netflix|prime|spotify|hotstar|movies|bookmyshow/)) {
      parsedCategory = "entertainment";
    } else if (lowercaseMerchant.match(/rent|maintenance/)) {
      parsedCategory = "housing";
    } else if (lowercaseMerchant.match(/electricity|water|broadband|airtel|jio/)) {
      parsedCategory = "utilities";
    } else if (lowercaseMerchant.match(/apollo|pharmacy|hospital|doctor/)) {
      parsedCategory = "health";
    }

    if (parsedAmount) {
      setAmount(parsedAmount);
      setMerchant(parsedMerchant);
      setCategory(parsedCategory);
      setParsed(true);
      toast.success("Successfully parsed SMS details!");
    } else {
      toast.error("Couldn't extract amount. Please enter details manually.");
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setSmsText(text);
      toast.success("SMS pasted from clipboard!");
    } catch {
      toast.error("Could not access clipboard. Please paste manually.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !merchant) {
      toast.error("Please enter a valid amount and merchant name");
      return;
    }

    addTransaction({
      merchant,
      amount: parseFloat(amount),
      date,
      category,
      source: "manual",
    });

    toast.success("Transaction added from SMS!");
    // Reset form
    setSmsText("");
    setAmount("");
    setMerchant("");
    setParsed(false);
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          SMS Ingestion Parser
        </CardTitle>
        <CardDescription>
          Paste transaction SMS notifications to instantly extract expense details.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="sms">Paste SMS Text</Label>
          <div className="flex gap-2">
            <Input
              id="sms"
              value={smsText}
              onChange={(e) => setSmsText(e.target.value)}
              placeholder="e.g. Amt Rs. 450.00 debited from HDFC account for Swiggy on 28-Jul-2026"
              className="flex-1"
            />
            <Button type="button" variant="outline" size="icon" onClick={handlePaste}>
              <Clipboard className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Button type="button" className="w-full" onClick={parseSMS}>
          Parse SMS Notification
        </Button>

        {parsed && (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Parsed Transaction Preview
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="parsed-merchant">Merchant</Label>
                <Input
                  id="parsed-merchant"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="parsed-amount">Amount (₹)</Label>
                <Input
                  id="parsed-amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="parsed-date">Transaction Date</Label>
                <Input
                  id="parsed-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={category} onValueChange={(val) => setCategory(val as ExpenseCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="shopping">Shopping</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="housing">Housing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full gap-2">
              <Check className="h-4 w-4" />
              Confirm and Add Transaction
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
