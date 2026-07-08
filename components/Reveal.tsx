"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  /** Stagger index — each step adds 60ms */
  index?: number;
  className?: string;
}

/**
 * Standard scroll reveal: 20px translate-up + fade, 400ms,
 * staggered 60ms per item, fires once.
 */
export default function Reveal({ children, index = 0, className }: RevealProps) {
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
