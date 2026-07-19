"use client";

import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPage } from "@/components/shared/status-page";

export default function OfflinePage() {
  return (
    <StatusPage
      icon={WifiOff}
      code="Offline"
      title="You're offline"
      description="Check your internet connection. Aurix will reconnect automatically."
      primaryAction={
        <Button onClick={() => window.location.reload()}>Retry</Button>
      }
    />
  );
}
