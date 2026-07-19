import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Cta() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 pb-24">
      <div className="rounded-2xl border border-border bg-surface px-8 py-16 text-center sm:px-16">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Take control of your financial life today
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Join thousands who use Aurix to plan smarter, spend intentionally,
          and build lasting wealth.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/register">
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
