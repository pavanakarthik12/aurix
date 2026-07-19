import { Compass } from "lucide-react";
import { StatusPage } from "@/components/shared/status-page";

export default function NotFound() {
  return (
    <StatusPage
      icon={Compass}
      code="404"
      title="Page not found"
      description="The page you're looking for doesn't exist or may have moved."
    />
  );
}
