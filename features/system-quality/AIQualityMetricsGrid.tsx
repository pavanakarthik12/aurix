"use client";

import { QualityMetricCard } from "./QualityMetricCard";

interface AIQualityMetrics {
  groundingRate: number | null;
  calculationAccuracy: number | null;
  responseCoherence?: number | null;
  contextUtilization?: number | null;
  ragRetrievalAccuracy?: number | null;
  hallucinationRate?: number | null;
  relevance?: number | null;
  hallucinationCases?: Array<{ id: string; scenario: string; issue: string }>;
  consistencyCases?: Array<any>;
}

interface AIQualityMetricsGridProps {
  aiQuality: AIQualityMetrics;
}

export function AIQualityMetricsGrid({ aiQuality }: AIQualityMetricsGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <QualityMetricCard
        title="Grounding Rate"
        value={aiQuality.groundingRate !== null ? `${(aiQuality.groundingRate * 100).toFixed(1)}%` : "N/A"}
        unit=""
        trend={aiQuality.groundingRate !== null && aiQuality.groundingRate > 0.8 ? "up" : "neutral"}
        positive={true}
      />
      <QualityMetricCard
        title="Calculation Accuracy"
        value={aiQuality.calculationAccuracy !== null ? `${(aiQuality.calculationAccuracy * 100).toFixed(1)}%` : "N/A"}
        unit=""
        trend={aiQuality.calculationAccuracy !== null && aiQuality.calculationAccuracy > 0.9 ? "up" : "neutral"}
        positive={true}
      />
      {aiQuality.responseCoherence !== null && aiQuality.responseCoherence !== undefined && (
        <QualityMetricCard
          title="Response Coherence"
          value={`${(aiQuality.responseCoherence * 100).toFixed(1)}%`}
          unit=""
          trend={aiQuality.responseCoherence > 0.85 ? "up" : "neutral"}
          positive={true}
        />
      )}
      {aiQuality.contextUtilization !== null && aiQuality.contextUtilization !== undefined && (
        <QualityMetricCard
          title="Context Utilization"
          value={`${(aiQuality.contextUtilization * 100).toFixed(1)}%`}
          unit=""
          trend={aiQuality.contextUtilization > 0.7 ? "up" : "neutral"}
          positive={true}
        />
      )}
      {aiQuality.ragRetrievalAccuracy !== null && aiQuality.ragRetrievalAccuracy !== undefined && (
        <QualityMetricCard
          title="RAG Retrieval Accuracy"
          value={`${(aiQuality.ragRetrievalAccuracy * 100).toFixed(1)}%`}
          unit=""
          trend={aiQuality.ragRetrievalAccuracy > 0.8 ? "up" : "neutral"}
          positive={true}
        />
      )}
    </div>
  );
}
