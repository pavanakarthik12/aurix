"use client";

import { useState, useEffect } from "react";
import {
  LayoutGrid,
  Receipt,
  Target,
  Sparkles,
  FileBarChart,
  Settings,
  UserRound,
  BookOpen,
  Microscope,
  Server,
  AlertTriangle,
  XCircle,
  Loader2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Progress } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useExpensesStore } from "@/store/expenses-store";
import { useGoalsStore } from "@/store/goals-store";
import { usePersonaStore } from "@/store/persona-store";
import { useUIStore } from "@/store/ui-store";
import { useMemo } from "react";
import { formatCurrency, formatCompactNumber } from "@/lib/format";
import { totalSpending, getMonthlyTransactions, savingsRate } from "@/lib/financial-engine";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

function getMonthlyTransactions(transactions: any[], months: number = 1) {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  return transactions.filter((t: any) => new Date(t.date) >= cutoff);
}

export function SystemQualityDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const transactions = useExpensesStore((s) => s.transactions);
  const goals = useGoalsStore((s) => s.goals);
  const monthlyIncome = usePersonaStore((s) => s.profile.monthlyIncome || 0);
  const spending = useMemo(() => totalSpending(getMonthlyTransactions(transactions, 1)), [transactions]);
  const rate = savingsRate(monthlyIncome, spending);

  const [performanceData, setPerformanceData] = useState({
    ocrProcessingTime: null as number | null,
    csvProcessingTime: null as number | null,
    pdfProcessingTime: null as number | null,
    transactionNormalizationTime: null as number | null,
    categorizationTime: null as number | null,
    aiRequestLatency: null as number | null,
    timeToFirstToken: null as number | null,
    totalResponseTime: null as number | null,
    tokenUsage: null as number | null,
    successfulRequests: null as number | null,
    failedRequests: null as number | null,
    documentIngestionTime: null as number | null,
    embeddingGenerationTime: null as number | null,
    retrievalLatency: null as number | null,
    ragEndToEnd: null as number | null,
    transactionQueryTime: null as number | null,
    analyticsQueryTime: null as number | null,
    largeDatasetTime: null as number | null,
    throughput: null as number | null,
  });

  const [securityChecks, setSecurityChecks] = useState({
    score: 0,
    overallStatus: "not-tested" as "passed" | "warning" | "failed" | "not-tested",
    passed: 0,
    totalChecks: 0,
    checks: [] as Array<{
      id: string;
      category: string;
      name: string;
      status: "passed" | "warning" | "failed" | "not-tested";
      detail?: string;
    }>,
  });

  const [aiQuality, setAIQuality] = useState({
    groundingRate: null as number | null,
    calculationAccuracy: null as number | null,
    hallucinationRate: null as number | null,
    relevance: null as number | null,
    hallucinationCases: [] as Array<{ id: string; scenario: string; issue: string }>,
    consistencyCases: [] as Array<{ id: string; scenario: string; result1: string; result2: string }>,
  });

  const [systemHealth, setSystemHealth] = useState({
    apiAvailability: "online" as "online" | "degraded" | "offline",
    databaseStatus: "healthy" as "healthy" | "degraded" | "offline",
    aiProviderStatus: "available" as "available" | "unavailable" | "unknown",
    ocrStatus: "ready" as "ready" | "processing" | "error",
  });

  useEffect(() => {
    fetchPerformanceData().then(setPerformanceData);
    fetchSecurityChecks().then(setSecurityChecks);
    fetchAIQuality().then(setAIQuality);
    fetchSystemHealth().then(setSystemHealth);
  }, [searchParams]);

  const refresh = () => {
    router.refresh();
  };

  const performanceStats = useMemo(() => ({
    transactions: transactions.length,
    goals: goals.length,
    monthlyIncome,
    spending,
    savings: monthlyIncome - spending,
    savingsRate: rate,
  }), [transactions.length, goals.length, monthlyIncome, spending, rate]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="space-y-6">

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">System Quality</h2>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              <Server className="h-1.5 w-1.5 mr-1" /> Live
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick=(() => {
                fetchPerformanceData().then(setPerformanceData);
                fetchSecurityChecks().then(setSecurityChecks);
                fetchAIQuality().then(setAIQuality);
                fetchSystemHealth().then(setSystemHealth);
              })
            >
              <Loader2 className="h-4 w-4" /> Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick=(() => {
                router.push("/api/quality/benchmark");
              })
            >
              Run Benchmark
            </Button>
          </div>
        </div>

        <PerformanceSummaryCard stats={performanceStats} />

        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="flex flex-wrap gap-2">
            <TabsTrigger value="performance" className="sm:px-3 py-1.5 text-xs font-medium transition-colors">
              Performance
            </TabsTrigger>
            <TabsTrigger value="security" className="sm:px-3 py-1.5 text-xs font-medium transition-colors">
              Security
            </TabsTrigger>
            <TabsTrigger value="ai-quality" className="sm:px-3 py-1.5 text-xs font-medium transition-colors">
              AI Quality
            </TabsTrigger>
            <TabsTrigger value="system-health" className="sm:px-3 py-1.5 text-xs font-medium transition-colors">
              System Health
            </TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="mt-4">
            <PerformanceMetricsGrid performanceData={performanceData} />
          </TabsContent>

          <TabsContent value="security" className="mt-4">
            <SecurityAssessmentGrid securityChecks={securityChecks} />
          </TabsContent>

          <TabsContent value="ai-quality" className="mt-4">
            <AIQualityMetricsGrid aiQuality={aiQuality} />
          </TabsContent>

          <TabsContent value="system-health" className="mt-4">
            <SystemHealthGrid systemHealth={systemHealth} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

async function fetchPerformanceData(): Promise<{
  ocrProcessingTime: number | null;
  csvProcessingTime: number | null;
  pdfProcessingTime: number | null;
  transactionNormalizationTime: number | null;
  categorizationTime: number | null;
  aiRequestLatency: number | null;
  timeToFirstToken: number | null;
  totalResponseTime: number | null;
  tokenUsage: number | null;
  successfulRequests: number | null;
  failedRequests: number | null;
  documentIngestionTime: number | null;
  embeddingGenerationTime: number | null;
  retrievalLatency: number | null;
  ragEndToEnd: number | null;
  transactionQueryTime: number | null;
  analyticsQueryTime: number | null;
  largeDatasetTime: number | null;
  throughput: number | null;
}> {
  try {
    const res = await fetch("/api/v1/benchmark/expense-processing?dataset_size=100", {
      cache: "no-cache",
    });
    if (res.ok) {
      const data = await res.json();
      return {
        ocrProcessingTime: data.ocr_processing_time_ms ?? null,
        csvProcessingTime: data.csv_processing_time_ms ?? null,
        pdfProcessingTime: data.pdf_processing_time_ms ?? null,
        transactionNormalizationTime: data.transaction_normalization_time_ms ?? null,
        categorizationTime: data.categorization_time_ms ?? null,
        aiRequestLatency: null,
        timeToFirstToken: null,
        totalResponseTime: null,
        tokenUsage: null,
        successfulRequests: null,
        failedRequests: null,
        documentIngestionTime: null,
        embeddingGenerationTime: null,
        retrievalLatency: null,
        ragEndToEnd: null,
        transactionQueryTime: null,
        analyticsQueryTime: null,
        largeDatasetTime: null,
        throughput: null,
      };
    }
    return {} as any;
  } catch (e) {
    console.error("Failed to fetch performance data:", e);
    return {
      ocrProcessingTime: null,
      csvProcessingTime: null,
      pdfProcessingTime: null,
      transactionNormalizationTime: null,
      categorizationTime: null,
      aiRequestLatency: null,
      timeToFirstToken: null,
      totalResponseTime: null,
      tokenUsage: null,
      successfulRequests: null,
      failedRequests: null,
      documentIngestionTime: null,
      embeddingGenerationTime: null,
      retrievalLatency: null,
      ragEndToEnd: null,
      transactionQueryTime: null,
      analyticsQueryTime: null,
      largeDatasetTime: null,
      throughput: null,
    };
  }
}

async function fetchSecurityChecks(): Promise<{
  score: number;
  overallStatus: "passed" | "warning" | "failed" | "not-tested";
  passed: number;
  totalChecks: number;
  checks: Array<{
    id: string;
    category: string;
    name: string;
    status: "passed" | "warning" | "failed" | "not-tested";
    detail?: string;
  }>;
}> {
  try {
    const res = await fetch("/api/v1/security-assessment/full", {
      cache: "no-cache",
    });
    if (res.ok) {
      const data = await res.json();
      return {
        score: data.score,
        overallStatus: data.overall_status,
        passed: data.passed,
        totalChecks: data.total,
        checks: data.checks,
      };
    }
    return {
      score: 0,
      overallStatus: "not-tested",
      passed: 0,
      totalChecks: 0,
      checks: [],
    };
  } catch (e) {
    console.error("Failed to fetch security checks:", e);
    return {
      score: 0,
      overallStatus: "not-tested",
      passed: 0,
      totalChecks: 0,
      checks: [],
    };
  }
}

async function fetchAIQuality(): Promise<{
  groundingRate: number | null;
  calculationAccuracy: number | null;
  hallucinationRate: number | null;
  relevance: number | null;
  hallucinationCases: Array<{ id: string; scenario: string; issue: string }>;
  consistencyCases: Array<{ id: string; scenario: string; result1: string; result2: string }>;
}> {
  try {
    const res = await fetch("/api/v1/ai-evaluation/evaluate?scenario=budget%20planning", {
      cache: "no-cache",
    });
    if (res.ok) {
      const data = await res.json();
      return {
        groundingRate: data.evaluation.groundingScore ?? null,
        calculationAccuracy: data.evaluation.calculationAccuracy ?? null,
        hallucinationRate: data.evaluation.hallucinationRate ?? null,
        relevance: data.evaluation.relevanceScore ?? null,
        hallucinationCases: data.test_cases
          .filter((tc: any) => tc.hallucination)
          .map((tc: any) => ({ id: tc.id, scenario: tc.input, issue: tc.errors?.[0] || "—" })),
        consistencyCases: data.test_cases
          .slice(0, 3)
          .map((tc: any) => ({
            id: tc.id,
            scenario: tc.input,
            result1: tc.actual_response,
            result2: "—",
          })),
      };
    }
    return {
      groundingRate: null,
      calculationAccuracy: null,
      hallucinationRate: null,
      relevance: null,
      hallucinationCases: [],
      consistencyCases: [],
    };
  } catch (e) {
    console.error("Failed to fetch AI quality:", e);
    return {
      groundingRate: null,
      calculationAccuracy: null,
      hallucinationRate: null,
      relevance: null,
      hallucinationCases: [],
      consistencyCases: [],
    };
  }
}

async function fetchSystemHealth(): Promise<{
  apiAvailability: "online" | "degraded" | "offline";
  databaseStatus: "healthy" | "degraded" | "offline";
  aiProviderStatus: "available" | "unavailable" | "unknown";
  ocrStatus: "ready" | "processing" | "error";
}> {
  try {
    const dbRes = await fetch("/api/v1/health", { cache: "no-cache" });
    const apiHealth = await dbRes.json();

    return {
      apiAvailability: apiHealth.status === "healthy" || apiHealth.status === "degraded"
        ? "online" : "offline",
      databaseStatus: apiHealth.database === "connected" ? "healthy" : "degraded",
      aiProviderStatus: apiHealth.grok === "connected" ? "available" : "unavailable",
      ocrStatus: "ready",
    };
  } catch (e) {
    console.error("Failed to fetch system health:", e);
    return {
      apiAvailability: "offline",
      databaseStatus: "offline",
      aiProviderStatus: "unavailable",
      ocrStatus: "error",
    };
  }
}