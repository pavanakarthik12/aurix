"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}

export function SelectCard({ icon: Icon, title, description, selected, onClick }: SelectCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors",
        selected
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-primary/30 hover:bg-accent"
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {selected && (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-3 w-3" />
        </span>
      )}
    </motion.button>
  );
}
