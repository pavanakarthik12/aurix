"use client";

import { useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { AnalyticsPage } from "@/features/analytics/analytics-page";

export default function Analytics() {
  useEffect(() => {
    document.title = "Aurix - Analytics | Financial Insights";
  }, []);

  return <AnalyticsPage />;
}