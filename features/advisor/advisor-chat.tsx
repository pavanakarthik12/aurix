"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Bot, User, Brain, Loader2, Wifi, BookOpen, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GuruDebateView, GuruDebateSkeleton } from "./guru-debate";
import { RecommendationsList } from "./recommendations";
import { InsightsList } from "./insights-list";
import { PredictionsWidget } from "./predictions";
import { getMultiToolResponse, getAIRecommendations, getSpendingInsights, getPredictions } from "@/services/advisor-service";
import { getGuruDebate } from "@/services/advisor-service";
import type { GuruDebate, AIAgentTool } from "@/types/finance";

const SUGGESTED_QUESTIONS = [
  "Should I buy an iPhone on EMI?",
  "Can I afford a vacation next month?",
  "How financially healthy am I?",
  "Where am I wasting the most money?",
  "What would Warren Buffett recommend?",
  "Predict my spending for next month",
];

const TOOL_LABELS: Record<AIAgentTool, string> = {
  "expense-extraction": "Expense Extraction",
  "budget-planner": "Budget Planner",
  "financial-advisor": "Financial Advisor",
  "goal-tracker": "Goal Tracker",
  "health-score": "Health Score",
  "book-search": "Book Search",
  "transaction-search": "Transaction Search",
  "splitwise-search": "Splitwise Search",
  "investment-advisor": "Investment Advisor",
  "savings-planner": "Savings Planner",
  "future-prediction": "Future Prediction",
};

const TOOL_ICONS: Record<AIAgentTool, React.ElementType> = {
  "expense-extraction": Wallet,
  "budget-planner": Wallet,
  "financial-advisor": Brain,
  "goal-tracker": TrendingUp,
  "health-score": Sparkles,
  "book-search": BookOpen,
  "transaction-search": Wallet,
  "splitwise-search": Wifi,
  "investment-advisor": TrendingUp,
  "savings-planner": Wallet,
  "future-prediction": Sparkles,
};

interface ChatMessage {
  type: "user" | "bot";
  text: string;
  debate?: GuruDebate;
  tools?: AIAgentTool[];
  loading?: boolean;
}

export function AdvisorChat() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mode, setMode] = useState<"chat" | "insights" | "recommendations" | "predictions">("chat");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const ask = (question: string) => {
    if (!question.trim()) return;

    const userMsg: ChatMessage = { type: "user", text: question };
    const loadingMsg: ChatMessage = { type: "bot", text: "", loading: true };
    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setQuery("");

    setTimeout(() => {
      const response = getMultiToolResponse(question);
      const debate = getGuruDebate(question);
      setMessages((prev) => {
        const msgs = [...prev];
        msgs[msgs.length - 1] = {
          type: "bot",
          text: response.summary,
          debate,
          tools: response.tools,
        };
        return msgs;
      });
    }, 1200);
  };

  const recommendations = getAIRecommendations();
  const insights = getSpendingInsights();
  const predictions = getPredictions();

  return (
    <div className="space-y-6">
      <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)} className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="chat" className="gap-2">
            <Brain className="h-4 w-4" />
            AI Chat
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="predictions" className="gap-2">
            <Wallet className="h-4 w-4" />
            Predictions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4 mt-4">
          {messages.length === 0 && (
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Multi-Tool AI Agent
                </span>
              </div>
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
            </div>
          )}

          <div ref={scrollRef} className="max-h-[600px] space-y-5 overflow-y-auto pr-1">
            <AnimatePresence mode="popLayout">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className={`flex gap-3 ${msg.type === "user" ? "flex-row-reverse" : ""}`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      msg.type === "user" ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted-foreground"
                    }`}
                  >
                    {msg.type === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </span>

                  <div className={`max-w-[85%] space-y-3 ${msg.type === "user" ? "text-right" : ""}`}>
                    {msg.type === "user" ? (
                      <div className="inline-block rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                        {msg.text}
                      </div>
                    ) : msg.loading ? (
                      <div className="flex items-center gap-2 rounded-2xl bg-surface-muted px-4 py-2.5">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <div className="flex gap-1">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "150ms" }} />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {msg.tools && msg.tools.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {msg.tools.map((tool) => {
                              const ToolIcon = TOOL_ICONS[tool] || Brain;
                              return (
                                <Badge key={tool} variant="secondary" className="gap-1 text-[10px]">
                                  <ToolIcon className="h-3 w-3" />
                                  {TOOL_LABELS[tool] || tool}
                                </Badge>
                              );
                            })}
                          </div>
                        )}

                        {msg.debate && <GuruDebateView debate={msg.debate} />}

                        {msg.text && (
                          <Card className="border-primary/20 bg-primary/[0.04]">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-2">
                                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                <p className="text-sm leading-relaxed text-foreground">{msg.text}</p>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); ask(query); }}
            className="flex gap-2"
          >
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask Aurix anything about your finances…"
            />
            <Button type="submit" size="icon" disabled={!query.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="insights" className="mt-4">
          <InsightsList insights={insights} />
        </TabsContent>

        <TabsContent value="recommendations" className="mt-4">
          <RecommendationsList recommendations={recommendations} />
        </TabsContent>

        <TabsContent value="predictions" className="mt-4">
          <PredictionsWidget predictions={predictions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
