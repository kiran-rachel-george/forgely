"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ExamplesCarouselProps {
  examples: string[];
  onSelect: (value: string) => void;
}

export function ExamplesCarousel({ examples, onSelect }: ExamplesCarouselProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % examples.length);
    }, 2200);

    return () => clearInterval(timer);
  }, [examples.length]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Try this</p>
      <div className="mt-2 h-8 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.button
            key={examples[index]}
            type="button"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onSelect(examples[index])}
            className="text-left text-sm text-cyan-300 hover:text-cyan-200"
          >
            {`Try: ${examples[index]}`}
          </motion.button>
        </AnimatePresence>
      </div>
    </div>
  );
}
