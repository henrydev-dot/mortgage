"use client";

import { useEffect, useState } from "react";

/** Fake live Base block counter — ticks every ~2s (Base block time). */
export function useBlockNumber(start = 18_249_021) {
  const [block, setBlock] = useState(start);

  useEffect(() => {
    const id = setInterval(() => setBlock((b) => b + 1), 2000);
    return () => clearInterval(id);
  }, []);

  return block;
}
