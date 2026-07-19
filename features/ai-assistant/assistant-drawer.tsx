"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Send, X, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUIStore } from "@/store/ui-store";

const SUGGESTIONS = [
  "How can I save more this month?",
  "Review my spending on dining out",
  "Am I on track for my emergency fund?",
];

export function AssistantDrawer() {
  const open = useUIStore((s) => s.assistantOpen);
  const setOpen = useUIStore((s) => s.setAssistantOpen);

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
                  <p className="text-xs text-muted-foreground">Coming soon</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close assistant">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Lock className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                Your AI Advisor is warming up
              </p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Personalized, conversational financial guidance is arriving in
                the next release. Here&apos;s a preview of what you&apos;ll be
                able to ask.
              </p>
              <div className="mt-2 flex flex-col gap-2 self-stretch">
                {SUGGESTIONS.map((s) => (
                  <div
                    key={s}
                    className="rounded-lg border border-border bg-surface-muted px-3 py-2.5 text-left text-sm text-muted-foreground"
                  >
                    {s}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border p-4">
              <div className="flex items-center gap-2">
                <Input placeholder="Ask Aurix anything..." disabled />
                <Button size="icon" disabled aria-label="Send message">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
