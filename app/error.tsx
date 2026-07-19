"use client";

import { useEffect } from "react";
import { ServerCrash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPage } from "@/components/shared/status-page";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      icon={ServerCrash}
      code="500"
      title="Something went wrong"
      description="An unexpected error occurred on our end. Our team has been notified."
      primaryAction={<Button onClick={reset}>Try again</Button>}
    />
  );
}
