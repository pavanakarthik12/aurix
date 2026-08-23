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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Progress } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useExpensesStore } from "@/store/expenses-store";
import { useGoalsStore } from "@/store/goals-store";
import { usePersonaStore } from "@/store/persona-store";
import { totalSpending, savingsRate } from "@/lib/financial-engine";
import { formatCurrency, formatCompactNumber } from "@/lib/format";

export function SystemQualityMetrics() {
  const transactions = useExpensesStore((s) => s.transactions);
  const goals = useGoalsStore((s) => s.goals);
  const monthlyIncome = usePersonaStore((s) => s.profile.monthlyIncome || 0);
  const spending = useMemo(() => totalSpending(getMonthlyTransactions(transactions, 1)), [transactions]);
  const rate = savingsRate(monthlyIncome, spending);

  const performanceData = usePerformanceData();
  const securityChecks = useSecurityChecks();
  const aiQuality = useAIQualityMetrics();
  const systemHealth = useSystemHealth();

  return (
    <div className="mx-auto max-w-7xl">
      <div className="space-y-6">

        {/* Performance Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Performance</h2>
            <Badge variant="outline" className="text-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-primary text-primary-foreground" />
              Live
            </Badge>
          </div>

          <Tabs defaultValue="expense-processing" className="w-full">
            <TabsList className="flex flex-wrap gap-2">
              <TabsTrigger value="expense-processing" className="sm:px-3 py-1.5 text-xs font-medium transition-colors">
                Expense Processing
              </TabsTrigger>
              <TabsTrigger value="ai" className="sm:px-3 py-1.5 text-xs font-medium transition-colors">
                AI
              </TabsTrigger>
              <TabsTrigger value="rag" className="sm:px-3 py-1.5 text-xs font-medium transition-colors">
                RAG
              </TabsTrigger>
              <TabsTrigger value="database" className="sm:px-3 py-1.5 text-xs font-medium transition-colors">
                Database
              </TabsTrigger>
            </TabsList>

            <TabsContent value="expense-processing" className="mt-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <PerformanceCard
                  title="OCR Processing"
                  value={performanceData.ocrProcessingTime?.toFixed(2) || "Insufficient data"}
                  unit="ms"
                  trend={performanceData.ocrProcessingTime && performanceData.ocrProcessingTime < 500 ? "down" : "up"}
                  positive={!!performanceData.ocrProcessingTime}
                />
                <PerformanceCard
                  title="CSV Processing"
                  value={performanceData.csvProcessingTime?.toFixed(2) || "Insufficient data"}
                  unit="ms"
                  trend={performanceData.csvProcessingTime && performanceData.csvProcessingTime < 200 ? "down" : "up"}
                  positive={!!performanceData.csvProcessingTime}
                />
                <PerformanceCard
                  title="PDF Processing"
                  value={performanceData.pdfProcessingTime?.toFixed(2) || "Insufficient data"}
                  unit="ms"
                  trend={performanceData.pdfProcessingTime && performanceData.pdfProcessingTime < 1000 ? "down" : "up"}
                  positive={!!performanceData.pdfProcessingTime}
                />
                <PerformanceCard
                  title="Transaction Normalization"
                  value={performanceData.transactionNormalizationTime?.toFixed(2) || "Insufficient data"}
                  unit="ms"
                  trend={performanceData.transactionNormalizationTime && performanceData.transactionNormalizationTime < 100 ? "down" : "up"}
                  positive={!!performanceData.transactionNormalizationTime}
                />
                <PerformanceCard
                  title="Categorization"
                  value={performanceData.categorizationTime?.toFixed(2) || "Insufficient data"}
                  unit="ms"
                  trend={performanceData.categorizationTime && performanceData.categorizationTime < 200 ? "down" : "up"}
                  positive={!!performanceData.categorizationTime}
                />
              </div>
            </TabsContent>

            <TabsContent value="ai" className="mt-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <PerformanceCard
                  title="AI Request Latency"
                  value={performanceData.aiRequestLatency?.toFixed(2) || "Insufficient data"}
                  unit="ms"
                  trend={performanceData.aiRequestLatency && performanceData.aiRequestLatency < 2000 ? "down" : "up"}
                  positive={!!performanceData.aiRequestLatency}
                />
                <PerformanceCard
                  title="Time to First Token"
                  value={performanceData.timeToFirstToken?.toFixed(2) || "Insufficient data"}
                  unit="ms"
                  trend={performanceData.timeToFirstToken && performanceData.timeToFirstToken < 500 ? "down" : "up"}
                  positive={!!performanceData.timeToFirstToken}
                />
                <PerformanceCard
                  title="Total Response Time"
                  value={performanceData.totalResponseTime?.toFixed(2) || "Insufficient data"}
                  unit="ms"
                  trend={performanceData.totalResponseTime && performanceData.totalResponseTime < 3000 ? "down" : "up"}
                  positive={!!performanceData.totalResponseTime}
                />
                <PerformanceCard
                  title="Token Usage"
                  value={performanceData.tokenUsage || "Insufficient data"}
                  unit="tokens"
                  trend="neutral"
                  positive={false}
                />
                <PerformanceCard
                  title="Successful Requests"
                  value={performanceData.successfulRequests || "Insufficient data"}
                  unit="count"
                  trend="up"
                  positive=true
                />
                <PerformanceCard
                  title="Failed Requests"
                  value={performanceData.failedRequests || "Insufficient data"}
                  unit="count"
                  trend="down"
                  positive=false
                />
              </div>
            </TabsContent>

            <TabsContent value="rag" className="mt-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <PerformanceCard
                  title="Document Ingestion"
                  value={performanceData.documentIngestionTime?.toFixed(2) || "Insufficient data"}
                  unit="ms"
                  trend={performanceData.documentIngestionTime && performanceData.documentIngestionTime < 1000 ? "down" : "up"}
                  positive={!!performanceData.documentIngestionTime}
                />
                <PerformanceCard
                  title="Embedding Generation"
                  value={performanceData.embeddingGenerationTime?.toFixed(2) || "Insufficient data"}
                  unit="ms"
                  trend={performanceData.embeddingGenerationTime && performanceData.embeddingGenerationTime < 500 ? "down" : "up"}
                  positive={!!performanceData.embeddingGenerationTime}
                />
                <PerformanceCard
                  title="Retrieval Latency"
                  value={performanceData.retrievalLatency?.toFixed(2) || "Insufficient data"}
                  unit="ms"
                  trend={performanceData.retrievalLatency && performanceData.retrievalLatency < 100 ? "down" : "up"}
                  positive={!!performanceData.retrievalLatency}
                />
                <PerformanceCard
                  title="End-to-End RAG"
                  value={performanceData.ragEndToEnd?.toFixed(2) || "Insufficient data"}
                  unit="ms"
                  trend={performanceData.ragEndToEnd && performanceData.ragEndToEnd < 2000 ? "down" : "up"}
                  positive={!!performanceData.ragEndToEnd}
                />
              </div>
            </TabsContent>

            <TabsContent value="database" className="mt-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <PerformanceCard
                  title="Transaction Query"
                  value={performanceData.transactionQueryTime?.toFixed(2) || "Insufficient data"}
                  unit="ms"
                  trend={performanceData.transactionQueryTime && performanceData.transactionQueryTime < 50 ? "down" : "up"}
                  positive={!!performanceData.transactionQueryTime}
                />
                <PerformanceCard
                  title="Analytics Query"
                  value={performanceData.analyticsQueryTime?.toFixed(2) || "Insufficient data"}
                  unit="ms"
                  trend={performanceData.analyticsQueryTime && performanceData.analyticsQueryTime < 200 ? "down" : "up"}
                  positive={!!performanceData.analyticsQueryTime}
                />
                <PerformanceCard
                  title="Large Dataset Processing"
                  value={performanceData.largeDatasetTime?.toFixed(2) || "Insufficient data"}
                  unit="ms"
                  trend={performanceData.largeDatasetTime && performanceData.largeDatasetTime < 5000 ? "down" : "up"}
                  positive={!!performanceData.largeDatasetTime}
                />
                <PerformanceCard
                  title="Throughput (txn/s)"
                  value={performanceData.throughput || "Insufficient data"}
                  unit="txn/s"
                  trend="up"
                  positive=true
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Security Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Security Assessment</h2>
            <Badge
              variant={
                securityChecks.overallStatus === "passed"
                  ? "success"
                  : securityChecks.overallStatus === " warnings" ? "warning" : "destructive"
              }
            >
              {securityChecks.overallStatus}
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {securityChecks.checks.map((check) => (
              <SecurityCheckCard key={check.id} check={check} />
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Overall Score</div>
              <div className="text-2xl font-bold">
                {Math.round(securityChecks.score * 100)}%
              </div>
            </div>
            <div className="text-sm font-medium">
              {securityChecks.passed}/{securityChecks.totalChecks} checks passed
            </div>
          </div>
        </div>

        {/* AI Quality Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">AI Quality</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QualityMetricCard
              title="Grounding Rate"
              value={aiQuality.groundingRate || "Insufficient data"}
              unit="%"
              trend={aiQuality.groundingRate && aiQuality.groundingRate >= 80 ? "up" : "down"}
              positive={!!aiQuality.groundingRate && aiQuality.groundingRate >= 80}
            />
            <QualityMetricCard
              title="Calculation Accuracy"
              value={aiQuality.calculationAccuracy || "Insufficient data"}
              unit="%"
              trend={aiQuality.calculationAccuracy && aiQuality.calculationAccuracy >= 90 ? "up" : "down"}
              positive={!!aiQuality.calculationAccuracy && aiQuality.calculationAccuracy >= 90}
            />
            <QualityMetricCard
              title="Hallucination Rate"
              value={aiQuality.hallucinationRate || "Insufficient data"}
              unit="%"
              trend={aiQuality.hallucinationRate && aiQuality.hallucinationRate < 10 ? "up" : "down"}
              positive={!!aiQuality.hallucinationRate && aiQuality.hallucinationRate < 10}
            />
            <QualityMetricCard
              title="Recommendation Relevance"
              value={aiQuality.relevance || "Insufficient data"}
              unit="%"
              trend="neutral"
              positive={false}
            />
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <div className="grid gap-4 sm:grid-cols-2">
              <HallucinationCaseCard cases={aiQuality.hallucinationCases || []} />
              <ConsistencyCaseCard cases={aiQuality.consistencyCases || []} />
            </div>
          </div>
        </div>

        {/* System Health Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">System Health</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <HealthStatusCard
              title="API Availability"
              status={systemHealth.apiAvailability}
              icon={
                systemHealth.apiAvailability === "online"
                  ? Server
                  : systemHealth.apiAvailability === "degraded" ? AlertTriangle : XCircle
              }
            />
            <HealthStatusCard
              title="Database Status"
              status={systemHealth.databaseStatus}
              icon={
                systemHealth.databaseStatus === "healthy"
                  ? Microscope
                  : systemHealth.databaseStatus === "degraded" ? AlertTriangle : XCircle
              }
            />
            <HealthStatusCard
              title="AI Provider Status"
              status={systemHealth.aiProviderStatus}
              icon={
                systemHealth.aiProviderStatus === "available"
                  ? Server
                  : systemHealth.aiProviderStatus === "unavailable" ? AlertTriangle : XCircle
              }
            />
            <HealthStatusCard
              title="OCR Status"
              status={systemHealth.ocrStatus}
              icon={
                systemHealth.ocrStatus === "ready"
                  ? Microscope
                  : systemHealth.ocrStatus === "processing" ? Loader2 : XCircle
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function getMonthlyTransactions(transactions: any[], months: number = 1) {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  return transactions.filter((t: any) => new Date(t.date) >= cutoff);
}

interface PerformanceData {
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
}

interface SecurityCheck {
  id: string;
  category: "authentication" | "authorization" | "data-protection" | "api-security" | "file-security" | "privacy" | "secret-management";
  name: string;
  status: "passed" | "warning" | "failed" | "not-tested";
  detail?: string;
}

interface AIQualityMetrics {
  groundingRate: number | null;
  calculationAccuracy: number | null;
  hallucinationRate: number | null;
  relevance: number | null;
  hallucinationCases: Array<{ id: string; scenario: string; issue: string }>;
  consistencyCases: Array<{ id: string; scenario: string; result1: string; result2: string }>;
}

interface SystemHealth {
  apiAvailability: "online" | "degraded" | "offline";
  databaseStatus: "healthy" | "degraded" | "offline";
  aiProviderStatus: "available" | "unavailable" | "unknown";
  ocrStatus: "ready" | "processing" | "error";
}