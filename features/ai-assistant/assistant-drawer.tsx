"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Send, X, Bot, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useUIStore } from "@/store/ui-store";
import { getMultiToolResponse, getGuruDebate } from "@/services/advisor-service";
import { GuruDebateView } from "@/features/advisor/guru-debate";

export function AssistantDrawer() {
  const open = useUIStore((s) => s.assistantOpen);
  const setOpen = useUIStore((s) => s.setAssistantOpen);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<{ text: string; debate?: ReturnType<typeof getGuruDebate> } | null>(null);
  const [loading, setLoading] = useState(false);

  const ask = (question: string) => {
    if (!question.trim()) return;
    setLoading(true);
    setQuery("");
    setTimeout(() => {
      const result = getMultiToolResponse(question);
      const debate = getGuruDebate(question);
      setResponse({ text: result.summary, debate });
      setLoading(false);
    }, 1000);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-sm flex-col border-l border-border bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-4.5 w-4.5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">AI Advisor</p>
                  <Badge variant="success" className="text-[10px]">Live</Badge>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close assistant">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {!response && !loading && (
                <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Brain className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    Ask Aurix anything
                  </p>
                  <p className="max-w-xs text-sm text-muted-foreground">
                    Get personalized financial advice powered by multi-guru intelligence.
                  </p>
                </div>
              )}

              {loading && (
                <div className="flex items-center gap-3 rounded-xl bg-surface-muted p-4">
                  <Bot className="h-5 w-5 animate-pulse text-primary" />
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}

              {response && !loading && (
                <div className="space-y-4">
                  {response.debate && <GuruDebateView debate={response.debate} />}
                  {response.text && (
                    <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-4">
                      <p className="text-sm leading-relaxed text-foreground">{response.text}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-border p-4">
              <form
                onSubmit={(e) => { e.preventDefault(); ask(query); }}
                className="flex items-center gap-2"
              >
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask Aurix anything..."
                />
                <Button type="submit" size="icon" disabled={!query.trim() || loading} aria-label="Send message">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
