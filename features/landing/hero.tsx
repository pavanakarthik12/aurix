"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, PlayCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-16 px-6 py-20 md:grid-cols-2 md:items-center md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <Badge variant="outline" className="gap-1.5 border-primary/20 bg-primary/5 text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Built for trust and clarity
          </Badge>

          <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-[3.25rem] md:leading-[1.08]">
            Intelligent finance.
            <br />
            <span className="text-primary">Simplified.</span>
          </h1>

          <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
            Aurix is a premium financial operating system that helps you
            understand, organize, and improve your financial life — with
            AI-driven insights grounded in proven financial principles.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/register">
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">
                <PlayCircle className="h-4 w-4" />
                See how it works
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground">
            <span>No credit card required</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span>Bank-grade data privacy</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative"
        >
          <Card className="p-6 shadow-lg">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <p className="text-xs text-muted-foreground">Net Worth</p>
                <p className="text-2xl font-semibold text-foreground">₹18,42,600</p>
              </div>
              <Badge variant="success">+4.2% this month</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 py-5">
              <div className="rounded-lg bg-surface-muted p-4">
                <p className="text-xs text-muted-foreground">Monthly Spending</p>
                <p className="mt-1 text-lg font-semibold text-foreground">₹52,300</p>
              </div>
              <div className="rounded-lg bg-surface-muted p-4">
                <p className="text-xs text-muted-foreground">Savings Rate</p>
                <p className="mt-1 text-lg font-semibold text-foreground">31%</p>
              </div>
            </div>
            <div className="space-y-3 rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-medium text-muted-foreground">Financial Persona</p>
              <p className="text-base font-semibold text-foreground">The Strategic Saver</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline">Moderate Risk</Badge>
                <Badge variant="outline">Long-Term Thinker</Badge>
              </div>
            </div>
          </Card>

          <div
            aria-hidden
            className="absolute -right-6 -top-6 -z-10 h-40 w-40 rounded-full bg-secondary/10 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-8 -left-8 -z-10 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
          />
        </motion.div>
      </div>
    </section>
  );
}
