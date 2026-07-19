"use client";

import { useState } from "react";
import { Sparkles, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getFinancialAdvice, type AdviceResult } from "@/lib/financial-advice";

const SUGGESTED_QUESTIONS = [
  "Should I buy a phone on EMI?",
  "How much should I save every month?",
  "How do I pay off multiple loans?",
  "Is it worth starting a SIP now?",
];

export function AdvisorChat() {
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<AdviceResult[]>([]);

  const ask = (question: string) => {
    if (!question.trim()) return;
    setHistory((prev) => [...prev, getFinancialAdvice(question)]);
    setQuery("");
  };

  return (
    <div className="space-y-6">
      {history.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => ask(q)}
              className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-6">
        {history.map((result, i) => (
          <div key={i} className="space-y-3">
            <p className="text-sm font-medium text-foreground">{result.query}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {result.responses.map(({ guru, principle }) => (
                <Card key={principle.id}>
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{guru.emoji}</span>
                      <p className="text-sm font-semibold text-foreground">{guru.name}</p>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">{principle.principle}</p>
                    <p className="text-sm text-foreground">{principle.advice}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex items-start gap-2 p-4">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <Badge variant="default" className="mb-1">AI Summary</Badge>
                  <p className="text-sm text-foreground">{result.summary}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(query);
        }}
        className="flex gap-2"
      >
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a financial question…"
        />
        <Button type="submit" size="icon" disabled={!query.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
