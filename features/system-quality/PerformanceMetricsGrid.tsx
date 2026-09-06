"use client";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Server, AlertTriangle, Loader2, Clock } from "lucide-react";

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

interface PerformanceCardProps {
  title: string;
  value: string;
  unit: string;
  trend?: "up" | "down" | "neutral";
  positive?: boolean;
}

function PerformanceCard({ title, value, unit, trend, positive }: PerformanceCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{title}</span>
            {trend === "up" && positive && <Badge variant="default" className="bg-green-500">↑</Badge>}
            {trend === "down" && positive && <Badge variant="default" className="bg-green-500">↓</Badge>}
            {trend === "up" && !positive && <Badge variant="destructive">↑</Badge>}
            {trend === "down" && !positive && <Badge variant="destructive">↓</Badge>}
          </div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground">{unit}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PerformanceMetricsGrid({ performanceData }: {
  performanceData: PerformanceData;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <PerformanceCard
        title="OCR Processing"
        value={performanceData.ocrProcessingTime !== undefined
          ? `${performanceData.ocrProcessingTime.toFixed(2)} ms`
          : "Insufficient data"}
        unit="ms"
        trend={performanceData.ocrProcessingTime && performanceData.ocrProcessingTime < 500 ? "down" : "up"}
        positive={!!performanceData.ocrProcessingTime}
      />
      <PerformanceCard
        title="CSV Processing"
        value={performanceData.csvProcessingTime !== undefined
          ? `${performanceData.csvProcessingTime.toFixed(2)} ms`
          : "Insufficient data"}
        unit="ms"
        trend={performanceData.csvProcessingTime && performanceData.csvProcessingTime < 200 ? "down" : "up"}
        positive={!!performanceData.csvProcessingTime}
      />
      <PerformanceCard
        title="PDF Processing"
        value={performanceData.pdfProcessingTime !== undefined
          ? `${performanceData.pdfProcessingTime.toFixed(2)} ms`
          : "Insufficient data"}
        unit="ms"
        trend={performanceData.pdfProcessingTime && performanceData.pdfProcessingTime < 1000 ? "down" : "up"}
        positive={!!performanceData.pdfProcessingTime}
      />
      <PerformanceCard
        title="Transaction Normalization"
        value={performanceData.transactionNormalizationTime !== undefined
          ? `${performanceData.transactionNormalizationTime.toFixed(2)} ms`
          : "Insufficient data"}
        unit="ms"
        trend={performanceData.transactionNormalizationTime && performanceData.transactionNormalizationTime < 100 ? "down" : "up"}
        positive={!!performanceData.transactionNormalizationTime}
      />
      <PerformanceCard
        title="Categorization"
        value={performanceData.categorizationTime !== undefined
          ? `${performanceData.categorizationTime.toFixed(2)} ms`
          : "Insufficient data"}
        unit="ms"
        trend={performanceData.categorizationTime && performanceData.categorizationTime < 200 ? "down" : "up"}
        positive={!!performanceData.categorizationTime}
      />
      <PerformanceCard
        title="AI Request Latency"
        value={performanceData.aiRequestLatency !== undefined
          ? `${performanceData.aiRequestLatency.toFixed(2)} ms`
          : "Insufficient data"}
        unit="ms"
        trend={performanceData.aiRequestLatency && performanceData.aiRequestLatency < 2000 ? "down" : "up"}
        positive={!!performanceData.aiRequestLatency}
      />
      <PerformanceCard
        title="Time to First Token"
        value={performanceData.timeToFirstToken !== undefined
          ? `${performanceData.timeToFirstToken.toFixed(2)} ms`
          : "Insufficient data"}
        unit="ms"
        trend={performanceData.timeToFirstToken && performanceData.timeToFirstToken < 500 ? "down" : "up"}
        positive={!!performanceData.timeToFirstToken}
      />
      <PerformanceCard
        title="Total Response Time"
        value={performanceData.totalResponseTime !== undefined
          ? `${performanceData.totalResponseTime.toFixed(2)} ms`
          : "Insufficient data"}
        unit="ms"
        trend={performanceData.totalResponseTime && performanceData.totalResponseTime < 3000 ? "down" : "up"}
        positive={!!performanceData.totalResponseTime}
      />
      <PerformanceCard
        title="Token Usage"
        value={performanceData.tokenUsage !== undefined
          ? `${performanceData.tokenUsage} tokens`
          : "Insufficient data"}
        unit="tokens"
        trend="neutral"
        positive={false}
      />
      <PerformanceCard
        title="Successful Requests"
        value={performanceData.successfulRequests !== undefined
          ? `${performanceData.successfulRequests} successful`
          : "Insufficient data"}
        unit="count"
        trend="up"
        positive={true}
      />
      <PerformanceCard
        title="Failed Requests"
        value={performanceData.failedRequests !== undefined
          ? `${performanceData.failedRequests} failed`
          : "Insufficient data"}
        unit="count"
        trend="down"
        positive={false}
      />
      <PerformanceCard
        title="Document Ingestion"
        value={performanceData.documentIngestionTime !== undefined
          ? `${performanceData.documentIngestionTime.toFixed(2)} ms`
          : "Insufficient data"}
        unit="ms"
        trend={performanceData.documentIngestionTime && performanceData.documentIngestionTime < 1000 ? "down" : "up"}
        positive={!!performanceData.documentIngestionTime}
      />
      <PerformanceCard
        title="Embedding Generation"
        value={performanceData.embeddingGenerationTime !== undefined
          ? `${performanceData.embeddingGenerationTime.toFixed(2)} ms`
          : "Insufficient data"}
        unit="ms"
        trend={performanceData.embeddingGenerationTime && performanceData.embeddingGenerationTime < 500 ? "down" : "up"}
        positive={!!performanceData.embeddingGenerationTime}
      />
      <PerformanceCard
        title="Retrieval Latency"
        value={performanceData.retrievalLatency !== undefined
          ? `${performanceData.retrievalLatency.toFixed(2)} ms`
          : "Insufficient data"}
        unit="ms"
        trend={performanceData.retrievalLatency && performanceData.retrievalLatency < 100 ? "down" : "up"}
        positive={!!performanceData.retrievalLatency}
      />
      <PerformanceCard
        title="End-to-End RAG"
        value={performanceData.ragEndToEnd !== undefined
          ? `${performanceData.ragEndToEnd.toFixed(2)} ms`
          : "Insufficient data"}
        unit="ms"
        trend={performanceData.ragEndToEnd && performanceData.ragEndToEnd < 2000 ? "down" : "up"}
        positive={!!performanceData.ragEndToEnd}
      />
      <PerformanceCard
        title="Transaction Query"
        value={performanceData.transactionQueryTime !== undefined
          ? `${performanceData.transactionQueryTime.toFixed(2)} ms`
          : "Insufficient data"}
        unit="ms"
        trend={performanceData.transactionQueryTime && performanceData.transactionQueryTime < 50 ? "down" : "up"}
        positive={!!performanceData.transactionQueryTime}
      />
      <PerformanceCard
        title="Analytics Query"
        value={performanceData.analyticsQueryTime !== undefined
          ? `${performanceData.analyticsQueryTime.toFixed(2)} ms`
          : "Insufficient data"}
        unit="ms"
        trend={performanceData.analyticsQueryTime && performanceData.analyticsQueryTime < 200 ? "down" : "up"}
        positive={!!performanceData.analyticsQueryTime}
      />
      <PerformanceCard
        title="Large Dataset Processing"
        value={performanceData.largeDatasetTime !== undefined
          ? `${performanceData.largeDatasetTime.toFixed(2)} ms`
          : "Insufficient data"}
        unit="ms"
        trend={performanceData.largeDatasetTime && performanceData.largeDatasetTime < 5000 ? "down" : "up"}
        positive={!!performanceData.largeDatasetTime}
      />
      <PerformanceCard
        title="Throughput (txn/s)"
        value={performanceData.throughput !== undefined
          ? `${performanceData.throughput} txn/s`
          : "Insufficient data"}
        unit="txn/s"
        trend="up"
        positive={true}
      />
    </div>
  );
}