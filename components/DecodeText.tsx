"use client";

import { useEffect, useRef, useState } from "react";

const GLYPHS = "01<>/{}#*+=|░▒▓ΞΔ$";

interface DecodeTextProps {
  text: string;
  className?: string;
  /** ms before the first character locks in */
  startDelay?: number;
  /** ms between each character locking */
  charDelay?: number;
}

/**
 * Sci-fi decode effect: characters scramble through technical glyphs,
 * then lock in left to right. Renders plain text on the server and for
 * reduced-motion users.
 */
export default function DecodeText({
  text,
  className,
  startDelay = 250,
  charDelay = 70,
}: DecodeTextProps) {
  const [display, setDisplay] = useState(text);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const t0 = performance.now();
    const id = setInterval(() => {
      const elapsed = performance.now() - t0;
      let done = true;
      const next = text
        .split("")
        .map((ch, i) => {
          if (ch === " ") return ch;
          if (elapsed >= startDelay + i * charDelay) return ch;
          done = false;
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        })
        .join("");
      setDisplay(next);
      if (done) clearInterval(id);
    }, 45);

    return () => clearInterval(id);
  }, [text, startDelay, charDelay]);

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden="true">{display}</span>
    </span>
  );
}
