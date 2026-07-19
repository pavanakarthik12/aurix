"use client";

import { motion } from "framer-motion";
import { Sparkles, Receipt, Target } from "lucide-react";
import { Card } from "@/components/ui/card";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Financial Advisor",
    description:
      "Get personalized guidance synthesized from proven financial philosophies, tailored to your goals and risk appetite.",
  },
  {
    icon: Receipt,
    title: "Smart Expense Tracking",
    description:
      "Extract, categorize, and understand your spending automatically from screenshots, statements, and shared expenses.",
  },
  {
    icon: Target,
    title: "Financial Goals",
    description:
      "Set meaningful goals — an emergency fund, a home, retirement — and track real progress with clear, honest numbers.",
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Everything you need to run your finances like a pro
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Aurix combines advisory intelligence and expense automation into a
          single, calm workspace.
        </p>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {FEATURES.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}>
              <Card className="h-full p-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
