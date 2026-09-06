"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Microscope, Loader2, XCircle, AlertTriangle } from "lucide-react";

interface SystemHealth {
  apiAvailability: "online" | "degraded" | "offline";
  databaseStatus: "healthy" | "degraded" | "offline";
  aiProviderStatus: "available" | "unavailable" | "unknown";
  ocrStatus: "ready" | "processing" | "error";
}

interface HealthStatusCardProps {
  title: string;
  status: "online" | "degraded" | "offline" | "ready" | "processing" | "error";
  icon: React.ElementType;
}

export function SystemHealthGrid({ systemHealth }: {
  systemHealth: SystemHealth;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <HealthStatusCard
        title="API Availability"
        status={systemHealth.apiAvailability}
        icon={systemHealth.apiAvailability === "online"
          ? Server
          : systemHealth.apiAvailability === "degraded" ? AlertTriangle : XCircle}
      />
      <HealthStatusCard
        title="Database Status"
        status={systemHealth.databaseStatus === "healthy" ? "online" : systemHealth.databaseStatus}
        icon={systemHealth.databaseStatus === "healthy"
          ? Microscope
          : systemHealth.databaseStatus === "degraded" ? AlertTriangle : XCircle}
      />
      <HealthStatusCard
        title="AI Provider Status"
        status={systemHealth.aiProviderStatus === "available" ? "online" : systemHealth.aiProviderStatus === "unavailable" ? "offline" : "degraded"}
        icon={systemHealth.aiProviderStatus === "available"
          ? Server
          : systemHealth.aiProviderStatus === "unavailable" ? AlertTriangle : XCircle}
      />
      <HealthStatusCard
        title="OCR Status"
        status={systemHealth.ocrStatus}
        icon={systemHealth.ocrStatus === "ready"
          ? Microscope
          : systemHealth.ocrStatus === "processing" ? Loader2 : XCircle}
      />
    </div>
  );
}

function HealthStatusCard({ title, status, icon: Icon }: HealthStatusCardProps) {
  const bgMap = {
    online: "bg-success/10 text-success",
    degraded: "bg-warning/10 text-warning",
    offline: "bg-destructive/10 text-destructive",
    ready: "bg-success/10 text-success",
    processing: "bg-info/10 text-info",
    error: "bg-destructive/10 text-destructive",
  };

  const iconMap = {
    online: Server,
    degraded: AlertTriangle,
    offline: XCircle,
    ready: Microscope,
    processing: Loader2,
    error: XCircle,
  };

  return (
    <Card className="p-4 h-100">
      <div className="flex items-start gap-3">
        <Badge
          variant={status === "online" || status === "ready" ? "success" : status === "degraded" ? "warning" : "destructive"}
          className="mt-1.5 h-1 w-1 rounded-full flex-shrink-0"
        >
          <Icon className="h-1.5 w-1.5" />
        </Badge>
        <div>
          <div className="font-medium text-foreground">{title}</div>
          <div className="text-xs text-muted-foreground">{status}</div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t">
        <div className="text-success/20 bg-success/10 h-1.5 rounded w-full overflow-hidden mt-2">
          <div className="h-full bg-success/50 transition-all duration-500 ease-out" style={{ width: status === "online" || status === "ready" ? "100%" : status === "degraded" ? "70%" : "30%" }} />
        </div>
      </div>
    </Card>
  );
}