"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Brain, Lightbulb, BookOpen, ArrowRight, Calculator, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { GuruDebate } from "@/types/finance";

interface GuruDebateProps {
  debate: GuruDebate;
}

const GURU_ACCENTS: Record<string, { border: string; bg: string; icon: string }> = {
  buffett: { border: "border-emerald-500/30", bg: "bg-emerald-500/5", icon: "text-emerald-500" },
  kiyosaki: { border: "border-blue-500/30", bg: "bg-blue-500/5", icon: "text-blue-500" },
  sethi: { border: "border-amber-500/30", bg: "bg-amber-500/5", icon: "text-amber-500" },
  ramsey: { border: "border-red-500/30", bg: "bg-red-500/5", icon: "text-red-500" },
};

export function GuruDebateView({ debate }: GuruDebateProps) {
  const hasAdvice = debate.responses.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Multi-Guru Debate</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={debate.query}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-3 sm:grid-cols-2"
        >
          {debate.responses.map((r, i) => {
            const accent = GURU_ACCENTS[r.guruId] || GURU_ACCENTS.buffett;
            const hasEvidence = r.advice.includes("₹") || r.advice.includes("%");
            return (
              <motion.div
                key={r.guruId}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className={`overflow-hidden ${accent.border} ${accent.bg}`}>
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-lg">{r.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{r.guruName}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{r.philosophy}</p>
                      </div>
                    </div>
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                        <BookOpen className="mr-1 h-3 w-3" />
                        {r.principle}
                      </Badge>
                      {hasEvidence && (
                        <Badge variant="secondary" className="text-[10px]">
                          <Calculator className="mr-1 h-3 w-3" />
                          Data-backed
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/90">&ldquo;{r.advice}&rdquo;</p>
                    {r.principle && (
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                        <ArrowRight className="h-3 w-3" />
                        <span>Principle: {r.principle}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {debate.summary && (
        <Card className={`border-primary/20 bg-primary/[0.04] ${!hasAdvice ? "mt-0" : ""}`}>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">AI Synthesis</span>
              <Badge variant="secondary" className="ml-auto text-[10px]">
                {debate.confidence}% confidence
              </Badge>
            </div>
            <p className="text-sm leading-relaxed text-foreground/85 whitespace-pre-line">{debate.summary}</p>
            <div className="mt-3 flex items-center gap-2">
              <Progress value={debate.confidence} className="h-1.5" />
              <span className="shrink-0 text-[10px] text-muted-foreground">{debate.confidence}%</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function GuruDebateSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-40 animate-pulse rounded bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-28 animate-pulse rounded bg-muted" />
                <div className="h-3 w-36 animate-pulse rounded bg-muted" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
