"use client";

import { useEffect, useRef } from "react";
import { buildBoard, districtOf, tileGridPos } from "@/lib/game/config";

/**
 * Pixel-art Monopoly-style board on Canvas 2D.
 * 11×11 perimeter ring: 4 corner landmarks + 36 lots. Buildings are
 * procedurally drawn pixel sprites per tier/district; windows flicker
 * at night-city pace, owned lots show a flag, selection pulses.
 */

export interface BoardLot {
  id: number;
  district: string;
  name: string;
  tier: number;
  condition: number;
  owner: string | null;
  nightly: number | null;
  salePrice: number | null;
  value: number;
  earnedTotal: number;
}

interface GameBoardProps {
  lots: BoardLot[];
  me: string | null; // my wallet (lowercase)
  selected: number | null;
  onSelect: (tileId: number | null) => void;
  heat: Record<string, number>;
}

const N = 11; // ring dimension
const BOARD_TILES = buildBoard();

// palette
const COL = {
  bg: "#10173a",
  road: "#1b2350",
  roadLine: "#2c3670",
  lotGround: "#232c5e",
  lotEdge: "#2f3a75",
  windowOn: "#ffd97a",
  windowOff: "#3a4680",
  bank: "#5a6591",
  mine: "#e8543c",
  other: "#7fa8e0",
  sale: "#ffd97a",
  text: "#aeb8dd",
};

function hashCode(n: number) {
  let h = n ^ 0x9e3779b9;
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

export default function GameBoard({ lots, me, selected, onSelect, heat }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ lots, me, selected, heat });
  stateRef.current = { lots, me, selected, heat };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let size = 0;
    let cell = 0;
    // window flicker state per lot
    const flicker = new Map<number, number>();

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      const px = Math.min(rect?.width ?? 640, 760);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = Math.floor(px);
      cell = size / N;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
    };

    const px = (n: number) => Math.round(n);

    /** Draw one pixel-art building inside a tile rect. */
    const drawBuilding = (
      x: number,
      y: number,
      lot: BoardLot,
      time: number
    ) => {
      const d = districtOf(lot.district);
      const seed = hashCode(lot.id);
      const u = cell / 16; // pixel unit
      const baseY = y + cell - u * 2.5;

      // ground
      ctx.fillStyle = COL.lotGround;
      ctx.fillRect(px(x + 1), px(y + 1), px(cell - 2), px(cell - 2));
      ctx.strokeStyle = COL.lotEdge;
      ctx.lineWidth = 1;
      ctx.strokeRect(px(x + 1) + 0.5, px(y + 1) + 0.5, px(cell - 2) - 1, px(cell - 2) - 1);

      // building silhouette by tier
      const widths = [8, 9, 10, 10];
      const heights = [5, 7, 9, 11.5];
      const w = u * widths[lot.tier];
      const h = u * heights[lot.tier];
      const bx = x + (cell - w) / 2;
      const by = baseY - h;

      // body
      const body = lot.tier >= 2 ? "#39457f" : "#333e73";
      ctx.fillStyle = body;
      ctx.fillRect(px(bx), px(by), px(w), px(h));
      // side shade
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(px(bx + w - u * 1.5), px(by), px(u * 1.5), px(h));
      // roof / accent in district color
      ctx.fillStyle = d.color;
      if (lot.tier === 0) {
        // pitched roof
        ctx.fillRect(px(bx - u * 0.5), px(by - u * 1.5), px(w + u), px(u * 1.5));
        ctx.fillRect(px(bx + u), px(by - u * 2.5), px(w - u * 2), px(u));
      } else {
        ctx.fillRect(px(bx), px(by - u), px(w), px(u));
        if (lot.tier >= 2) ctx.fillRect(px(bx + w / 2 - u * 0.5), px(by - u * 3), px(u), px(u * 2));
        if (lot.tier === 3) {
          ctx.fillRect(px(bx + u), px(by - u * 2), px(u), px(u));
          ctx.fillRect(px(bx + w - u * 2), px(by - u * 2), px(u), px(u));
        }
      }

      // windows grid with flicker
      const cols = Math.max(2, Math.floor(widths[lot.tier] / 3));
      const rows = Math.max(1, Math.floor(heights[lot.tier] / 2.2));
      let f = flicker.get(lot.id) ?? seed;
      // occasionally toggle a bit
      if (Math.random() < 0.012) {
        f = (f ^ (1 << (Math.floor(Math.random() * 16)))) >>> 0;
        flicker.set(lot.id, f);
      }
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const bit = (seed >> ((r * cols + c) % 16)) & 1;
          const flick = (f >> ((r * cols + c + 3) % 16)) & 1;
          const on = lot.owner ? bit ^ flick : 0;
          ctx.fillStyle = on ? COL.windowOn : COL.windowOff;
          ctx.fillRect(
            px(bx + u * (1 + c * 2.6)),
            px(by + u * (1 + r * 2.2)),
            px(u * 1.2),
            px(u * 1.2)
          );
        }
      }

      // owner marker: flag stripe at the tile base
      if (lot.owner) {
        ctx.fillStyle = lot.owner === me ? COL.mine : COL.other;
        ctx.fillRect(px(x + 2), px(y + cell - u * 1.6), px(cell - 4), px(u * 0.9));
      }
      // Airbnb dot (animated pulse) / for-sale tag
      if (lot.nightly) {
        const pulse = 0.6 + 0.4 * Math.sin(time / 400 + lot.id);
        ctx.fillStyle = `rgba(232,84,60,${pulse})`;
        ctx.fillRect(px(x + cell - u * 3), px(y + u * 1.5), px(u * 1.6), px(u * 1.6));
      }
      if (lot.salePrice) {
        ctx.fillStyle = COL.sale;
        ctx.fillRect(px(x + u * 1.5), px(y + u * 1.5), px(u * 1.6), px(u * 1.6));
      }
    };

    const drawCorner = (x: number, y: number, label: string, time: number) => {
      ctx.fillStyle = "#1d2554";
      ctx.fillRect(px(x + 1), px(y + 1), px(cell - 2), px(cell - 2));
      ctx.strokeStyle = COL.lotEdge;
      ctx.strokeRect(px(x + 1) + 0.5, px(y + 1) + 0.5, px(cell - 2) - 1, px(cell - 2) - 1);
      const u = cell / 16;
      // landmark: compass-ish diamond
      ctx.save();
      ctx.translate(x + cell / 2, y + cell / 2 - u);
      ctx.rotate(time / 6000);
      ctx.fillStyle = "#4f7fd9";
      ctx.fillRect(-u * 2, -u * 2, u * 4, u * 4);
      ctx.fillStyle = "#e8543c";
      ctx.fillRect(-u * 0.7, -u * 0.7, u * 1.4, u * 1.4);
      ctx.restore();
      ctx.fillStyle = COL.text;
      ctx.font = `${Math.max(6, cell * 0.11)}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText(label, x + cell / 2, y + cell - u * 2);
    };

    const frame = (time: number) => {
      const { lots: L, selected: sel, heat: H } = stateRef.current;
      ctx.fillStyle = COL.bg;
      ctx.fillRect(0, 0, size, size);

      // inner road ring
      ctx.fillStyle = COL.road;
      ctx.fillRect(px(cell), px(cell), px(size - cell * 2), px(size - cell * 2));
      ctx.strokeStyle = COL.roadLine;
      ctx.setLineDash([4, 5]);
      ctx.strokeRect(px(cell * 1.5), px(cell * 1.5), px(size - cell * 3), px(size - cell * 3));
      ctx.setLineDash([]);

      // center panel
      const cx = cell * 2.2;
      ctx.fillStyle = "#141b42";
      ctx.fillRect(px(cx), px(cx), px(size - cx * 2), px(size - cx * 2));
      ctx.strokeStyle = COL.roadLine;
      ctx.strokeRect(px(cx) + 0.5, px(cx) + 0.5, px(size - cx * 2) - 1, px(size - cx * 2) - 1);
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${cell * 0.42}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText("MORTGAGE", size / 2, size / 2 - cell * 0.5);
      ctx.fillText("TYCOON", size / 2, size / 2);
      ctx.fillStyle = COL.text;
      ctx.font = `${cell * 0.14}px monospace`;
      ctx.fillText("EST. 2026 · LIVE ON BASE", size / 2, size / 2 + cell * 0.42);

      // district heat bars in the center
      const districts = Object.keys(H);
      const barW = (size - cx * 2 - cell) / districts.length;
      districts.forEach((id, i) => {
        const h = H[id] ?? 1;
        const norm = (h - 0.8) / 0.8; // 0..1
        const bh = cell * (0.3 + norm * 1.1);
        const bx = cx + cell * 0.5 + i * barW;
        const by = size / 2 + cell * 1.9;
        ctx.fillStyle = districtOf(id).color;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(px(bx), px(by - bh), px(barW * 0.55), px(bh));
        ctx.globalAlpha = 1;
      });
      ctx.fillStyle = COL.text;
      ctx.font = `${cell * 0.12}px monospace`;
      ctx.fillText("DISTRICT HEAT", size / 2, size / 2 + cell * 2.25);

      // tiles
      for (const tile of BOARD_TILES) {
        const { col, row } = tileGridPos(tile.id);
        const x = col * cell;
        const y = row * cell;
        if (tile.kind === "corner") {
          drawCorner(x, y, tile.cornerLabel!, time);
        } else {
          const lot = L.find((l) => l.id === tile.id);
          if (lot) drawBuilding(x, y, lot, time);
        }
        if (sel === tile.id) {
          const pulse = 1.5 + Math.sin(time / 250) * 1;
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2;
          ctx.strokeRect(
            px(x + pulse) + 0.5,
            px(y + pulse) + 0.5,
            px(cell - pulse * 2) - 1,
            px(cell - pulse * 2) - 1
          );
          ctx.lineWidth = 1;
        }
      }

      raf = requestAnimationFrame(frame);
    };

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const col = Math.floor((e.clientX - rect.left) / cell);
      const row = Math.floor((e.clientY - rect.top) / cell);
      // only perimeter tiles are clickable
      if (col < 0 || col >= N || row < 0 || row >= N) return;
      const onRing = col === 0 || col === N - 1 || row === 0 || row === N - 1;
      if (!onRing) {
        onSelect(null);
        return;
      }
      const tile = BOARD_TILES.find((t) => {
        const p = tileGridPos(t.id);
        return p.col === col && p.row === row;
      });
      onSelect(tile && tile.kind === "lot" ? tile.id : null);
    };

    resize();
    window.addEventListener("resize", resize);
    canvas.addEventListener("click", onClick);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("click", onClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full">
      <canvas ref={canvasRef} className="mx-auto block cursor-pointer rounded-lg" />
    </div>
  );
}
