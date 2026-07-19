"use client";

import { motion } from "framer-motion";
import { Sparkles, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { FinancialPersona } from "@/types/finance";
import { cn } from "@/lib/utils";

export function PersonaCard({
  persona,
  className,
}: {
  persona: FinancialPersona;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card
        className={cn(
          "overflow-hidden border-primary/15 bg-primary text-primary-foreground",
          className
        )}
      >
        <div className="flex items-center justify-between px-6 pt-6">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-primary-foreground/70">
            <ShieldCheck className="h-3.5 w-3.5" />
            Financial Persona
          </span>
          <Sparkles className="h-4 w-4 text-primary-foreground/60" />
        </div>

        <div className="px-6 pb-6 pt-3">
          <h3 className="text-2xl font-semibold tracking-tight">{persona.title}</h3>
          <p className="mt-2 max-w-md text-sm text-primary-foreground/80">
            {persona.summary}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Badge className="border-transparent bg-white/12 text-primary-foreground">
              {persona.riskLabel}
            </Badge>
            {persona.traits.map((trait) => (
              <Badge key={trait} className="border-transparent bg-white/12 text-primary-foreground">
                {trait}
              </Badge>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
