"use client";

import { useEffect, useState } from "react";

/**
 * Tiny always-present brand anchor, fixed bottom-right.
 * Hides over the final CTA section, where the mark appears large instead.
 */
export default function Watermark() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const target = document.getElementById("final-cta");
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHidden(entry.isIntersecting),
      { threshold: 0.15 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <img
      src="/brand/mark.svg"
      alt=""
      aria-hidden
      className={`pointer-events-none fixed bottom-5 right-5 z-40 h-6 w-6 transition-opacity duration-500 ${
        hidden ? "opacity-0" : "opacity-[0.08]"
      }`}
      style={{
        // Flatten the mark to pure compass blue
        filter:
          "brightness(0) saturate(100%) invert(31%) sepia(46%) saturate(1223%) hue-rotate(191deg) brightness(92%) contrast(91%)",
      }}
    />
  );
}
