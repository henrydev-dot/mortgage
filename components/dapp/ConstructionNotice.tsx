"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Construction, X } from "lucide-react";

const STORAGE_KEY = "mrt-construction-notice-dismissed";

/**
 * One-time (per browser session) notice shown when entering the app:
 * the interface is a preview and contracts are not live yet.
 */
export default function ConstructionNotice() {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem(STORAGE_KEY)) setOpen(true);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismiss();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/40 p-4 backdrop-blur-sm"
          role="alertdialog"
          aria-modal="true"
          aria-label="App under construction"
        >
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full max-w-md overflow-hidden rounded-lg border border-grid bg-paper shadow-[0_32px_90px_-30px_rgba(29,37,84,0.5)]"
          >
            {/* Window chrome */}
            <div className="relative flex items-center gap-1.5 border-b border-grid bg-fog px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-coral/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-ledger/50" />
              <span className="h-2.5 w-2.5 rounded-full bg-compass/60" />
              <span className="absolute left-1/2 hidden -translate-x-1/2 font-mono text-[9px] tracking-eyebrow text-ledger sm:block">
                MRT://NOTICE
              </span>
              <button
                onClick={dismiss}
                aria-label="Close"
                className="ml-auto text-ledger transition-colors hover:text-navy"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-coral/40 bg-coral/10">
                  <Construction size={18} strokeWidth={1.75} className="text-coral" />
                </span>
                <div>
                  <h2 className="font-display text-xl text-navy">
                    App under construction
                  </h2>
                  <p className="font-mono text-[10px] tracking-eyebrow text-ledger">
                    PREVIEW BUILD · CONTRACTS IN AUDIT
                  </p>
                </div>
              </div>

              <p className="mt-4 font-sans text-sm leading-relaxed text-navy/80">
                This interface is an early preview and protocol contracts are
                still in audit.{" "}
                <span className="font-medium text-navy">
                  Only use the payment flows shown inside this app
                </span>{" "}
                — never send funds to addresses received in DMs or comments.
              </p>

              <ul className="mt-4 space-y-1.5 font-mono text-[10px] leading-relaxed tracking-wide text-ledger">
                <li>· BROWSING AND WALLET CONNECTION ARE SAFE</li>
                <li>· AIRDROP APPLICATIONS AND DAO VOTES WORK (GASLESS)</li>
                <li>· STAKING & BORROWING ACTIVATE AFTER AUDIT</li>
                <li>· FOLLOW @BasedMortgage FOR ANNOUNCEMENTS</li>
              </ul>

              <button onClick={dismiss} className="btn-primary mt-6 w-full justify-center">
                I understand — enter the app
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
