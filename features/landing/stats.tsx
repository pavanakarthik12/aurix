"use client";

import { motion } from "framer-motion";
import { STATS } from "@/constants/site";

export function Stats() {
  return (
    <section className="border-y border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-16 md:grid-cols-4">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="text-center"
          >
            <p className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-primary-foreground/70">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
