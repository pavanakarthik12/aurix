"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useUIStore } from "@/store/ui-store";

export function AssistantFab() {
  const setOpen = useUIStore((s) => s.setAssistantOpen);

  return (
    <motion.button
      onClick={() => setOpen(true)}
      whileTap={{ scale: 0.94 }}
      whileHover={{ scale: 1.05 }}
      className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg animate-pulse-soft"
      aria-label="Open AI Assistant"
    >
      <Sparkles className="h-5.5 w-5.5" />
    </motion.button>
  );
}
