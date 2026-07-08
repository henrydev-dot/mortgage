"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";
import { faqItems } from "@/lib/faq";
import Reveal from "./Reveal";

function FaqRow({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  const reduced = useReducedMotion();

  return (
    <div className="border-b border-grid">
      <button
        className="flex w-full items-center justify-between gap-6 py-6 text-left"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="font-display text-lg text-navy md:text-xl">
          {question}
        </span>
        <Plus
          size={18}
          strokeWidth={1.5}
          className={`shrink-0 text-compass transition-transform duration-300 ${
            open ? "rotate-45" : ""
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduced ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="max-w-3xl pb-7 font-sans text-sm leading-relaxed text-ledger">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-16 py-24 md:py-32">
      <div className="container-line grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <Reveal>
            <p className="eyebrow mb-4">QUESTIONS</p>
          </Reveal>
          <Reveal index={1}>
            <h2 className="font-display text-4xl tracking-tight text-navy md:text-5xl">
              Answered, onchain and off.
            </h2>
          </Reveal>
          <Reveal index={2}>
            <p className="mt-5 max-w-sm font-sans text-sm leading-relaxed text-ledger">
              Everything else is in the whitepaper — the legal structure, the
              custody stack, and the full token mechanics.
            </p>
          </Reveal>
        </div>

        <div className="border-t border-grid">
          {faqItems.map((item, i) => (
            <Reveal key={item.question} index={i}>
              <FaqRow
                question={item.question}
                answer={item.answer}
                open={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
