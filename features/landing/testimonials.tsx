"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TESTIMONIALS } from "@/constants/site";
import { initials } from "@/lib/format";

export function Testimonials() {
  return (
    <section id="testimonials" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Trusted by people who take their finances seriously
        </h2>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <Card className="flex h-full flex-col gap-4 p-6">
              <Quote className="h-5 w-5 text-primary/40" />
              <p className="flex-1 text-sm leading-relaxed text-foreground">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3 border-t border-border pt-4">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>{initials(t.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
