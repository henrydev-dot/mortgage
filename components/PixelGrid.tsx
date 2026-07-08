"use client";

import { useEffect, useRef } from "react";

/**
 * Cursor-reactive pixel grid — the hero's single ambient effect.
 * A field of small squares; squares near the cursor scale up and shift
 * toward compass blue with soft falloff, easing back when the cursor
 * leaves. Static grid when prefers-reduced-motion.
 */
const CELL = 7; // square size, px
const GAP = 28; // grid spacing, px
const RADIUS = 180; // cursor influence radius, px
const EASE_RETURN = 0.08; // ease-out factor per frame
const WAVE_SPEED = 340; // px per second
const WAVE_BAND = 70; // thickness of the expanding ring
const WAVE_EVERY = 6500; // ms between autonomous pulses

// --grid-line and --compass-blue, pre-split for cheap per-frame lerp
const BASE_RGB = [231, 233, 237];
const ACTIVE_RGB = [39, 92, 171];

export default function PixelGrid({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    // Per-cell interpolation state, 0 = at rest, 1 = fully excited
    let cells: { x: number; y: number; t: number }[] = [];
    const mouse = { x: -9999, y: -9999 };
    // Autonomous radar pulse: a ring expanding from a random point,
    // so the grid feels alive even before the cursor arrives.
    const wave = { x: 0, y: 0, r: 0, active: false };
    let rafId = 0;
    let waveTimer = 0;

    const startWave = () => {
      wave.x = width * (0.15 + Math.random() * 0.7);
      wave.y = height * (0.15 + Math.random() * 0.7);
      wave.r = 0;
      wave.active = true;
    };

    const buildGrid = () => {
      cells = [];
      for (let y = GAP / 2; y < height; y += GAP) {
        for (let x = GAP / 2; x < width; x += GAP) {
          cells.push({ x, y, t: 0 });
        }
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildGrid();
      if (reduced) drawStatic();
    };

    const drawStatic = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = `rgba(${BASE_RGB.join(",")}, 0.9)`;
      for (const c of cells) {
        ctx.fillRect(c.x - CELL / 2, c.y - CELL / 2, CELL, CELL);
      }
    };

    let lastTime = 0;
    const frame = (time: number) => {
      const dt = lastTime ? Math.min(time - lastTime, 64) : 16;
      lastTime = time;

      if (wave.active) {
        wave.r += (WAVE_SPEED * dt) / 1000;
        if (wave.r - WAVE_BAND > Math.max(width, height) * 1.1) wave.active = false;
      }

      ctx.clearRect(0, 0, width, height);
      for (const c of cells) {
        const dx = c.x - mouse.x;
        const dy = c.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Target excitement with soft falloff inside the radius
        let target = dist < RADIUS ? 1 - dist / RADIUS : 0;

        if (wave.active) {
          const wdx = c.x - wave.x;
          const wdy = c.y - wave.y;
          const wdist = Math.sqrt(wdx * wdx + wdy * wdy);
          const ring = 1 - Math.abs(wdist - wave.r) / WAVE_BAND;
          if (ring > 0) target = Math.max(target, ring * 0.65);
        }
        // Snap up quickly, ease back out slowly
        c.t += (target - c.t) * (target > c.t ? 0.35 : EASE_RETURN);

        const t = c.t;
        const size = CELL + t * 6;
        const r = BASE_RGB[0] + (ACTIVE_RGB[0] - BASE_RGB[0]) * t;
        const g = BASE_RGB[1] + (ACTIVE_RGB[1] - BASE_RGB[1]) * t;
        const b = BASE_RGB[2] + (ACTIVE_RGB[2] - BASE_RGB[2]) * t;
        ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${0.9})`;
        ctx.fillRect(c.x - size / 2, c.y - size / 2, size, size);
      }
      rafId = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    resize();
    window.addEventListener("resize", resize);

    if (!reduced) {
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerleave", onLeave);
      rafId = requestAnimationFrame(frame);
      waveTimer = window.setInterval(startWave, WAVE_EVERY);
      window.setTimeout(startWave, 900);
    }

    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(waveTimer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
