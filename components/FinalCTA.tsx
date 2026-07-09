"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Reveal from "./Reveal";

export default function FinalCTA() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (response.ok) {
        setJoined(true);
      } else {
        console.error("Failed to join waitlist");
      }
    } catch (err) {
      console.error("Error joining waitlist:", err);
    }
  };

  return (
    <section id="final-cta" className="relative overflow-hidden bg-compass py-28 md:py-36">
      {/* The closing brand moment — mark at full presence */}
      <img
        src="/brand/mark.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute -right-24 top-1/2 h-[420px] w-[420px] -translate-y-1/2 opacity-[0.14] md:h-[560px] md:w-[560px]"
        style={{ filter: "brightness(0) invert(1)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="container-line relative z-10">
        <Reveal>
          <div className="mb-8 flex items-center gap-4">
            <img
              src="/brand/mark.svg"
              alt="Mortgage Estate mark"
              className="h-12 w-12"
              style={{ filter: "brightness(0) invert(1)" }}
            />
            <p className="font-mono text-[11px] tracking-eyebrow text-paper/70">
              WAITLIST · NEXT MINT OPENS Q3 2026
            </p>
          </div>
        </Reveal>
        <Reveal index={1}>
          <h2 className="max-w-3xl font-display text-4xl leading-[1.05] tracking-tight text-paper md:text-6xl">
            The deed is going digital.
            <br />
            Be holding when it does.
          </h2>
        </Reveal>

        <Reveal index={2}>
          {joined ? (
            <p className="mt-10 flex items-center gap-2.5 font-sans text-paper">
              <CheckCircle2 size={20} strokeWidth={1.5} />
              You&apos;re on the list — allocation details land in your inbox.
            </p>
          ) : (
            <form
              onSubmit={onSubmit}
              className="mt-10 flex max-w-lg flex-col gap-3 sm:flex-row"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Email address"
                className="h-12 flex-1 rounded border border-paper/30 bg-paper/10 px-4 font-sans text-sm text-paper placeholder:text-paper/50 focus:border-paper focus:outline-none"
              />
              {/* The page's single coral conversion moment */}
              <button type="submit" className="btn-coral h-12 justify-center whitespace-nowrap">
                Join the Waitlist
                <ArrowRight size={16} strokeWidth={1.75} />
              </button>
            </form>
          )}
        </Reveal>
        <Reveal index={3}>
          <p className="mt-6 font-mono text-[10px] tracking-eyebrow text-paper/50">
            NO SPAM · ALLOCATION PRIORITY BY POSITION
          </p>
        </Reveal>
      </div>
    </section>
  );
}
