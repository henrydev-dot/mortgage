/**
 * Mortgage Tycoon — game constants, board layout, and economy formulas.
 * Pure data + pure functions only: imported by both server and client.
 *
 * Time: 1 game day = 1 real hour. Offline progress caps at 72 game days.
 */

export const GAME_DAY_MS = 60 * 60 * 1000;
export const MAX_OFFLINE_DAYS = 72;
export const STARTING_BALANCE = 25_000;
export const MIN_WITHDRAW = 1_000;
export const MARKET_FEE = 0.05; // player-to-player sale fee (token sink)
export const BANK_BUYBACK = 0.7; // instant sale to bank at 70% of value
export const CLEANING_RATE = 0.12; // of nightly revenue
export const CONDITION_DECAY_PER_DAY = 1.5;
export const RENOVATE_FLOOR = 10;

export const TIERS = ["House", "Villa", "Residence", "Tower"] as const;
/** Sale/valuation multiplier per tier */
export const TIER_VALUE = [1, 1.6, 2.4, 3.6];
/** Nightly-rate multiplier per tier */
export const TIER_NIGHTLY = [1, 1.8, 3.2, 5.5];
/** Upgrade cost (× baseCost) from tier i to i+1 */
export const UPGRADE_COST = [0.6, 1.5, 3.5];

export interface District {
  id: string;
  name: string;
  color: string; // pixel-art roof/accent color
  baseCost: number;
}

export const DISTRICTS: District[] = [
  { id: "base", name: "Base City", color: "#4f7fd9", baseCost: 8_000 },
  { id: "miami", name: "Miami", color: "#3fb8af", baseCost: 14_000 },
  { id: "berlin", name: "Berlin", color: "#8a94a8", baseCost: 22_000 },
  { id: "tokyo", name: "Tokyo", color: "#b06fc9", baseCost: 32_000 },
  { id: "paris", name: "Paris", color: "#d9a04f", baseCost: 46_000 },
  { id: "dubai", name: "Dubai", color: "#c9b037", baseCost: 65_000 },
  { id: "riviera", name: "Riviera", color: "#e8843c", baseCost: 90_000 },
  { id: "monaco", name: "Monaco", color: "#e8543c", baseCost: 120_000 },
];

/** Heat: per-district demand multiplier, clamped */
export const HEAT_MIN = 0.8;
export const HEAT_MAX = 1.6;
export const HEAT_PER_PURCHASE = 0.06;
export const HEAT_DECAY_PER_DAY = 0.995;

const STREETS: Record<string, string[]> = {
  base: ["Genesis Block", "Bridge Row", "Sequencer St", "Rollup Ave", "Chain Plaza"],
  miami: ["Ocean Drive", "Sunbelt Ct", "Palm Bay", "Marina Walk"],
  berlin: ["Prenzlauer Hof", "Mitte Yard", "Kreuz Block", "Spree Line", "Tor Strasse"],
  tokyo: ["Shibuya Cross", "Ginza Lane", "Kanda Rise", "Ueno Court"],
  paris: ["Avenue Foch", "Marais Corner", "Rive Gauche", "Opera Block", "Bastille Row"],
  dubai: ["Marina Tower", "Palm Frond", "Downtown Rise", "Creek View"],
  riviera: ["Les Parcs", "Pampelonne", "Port Grimaud", "Cap Estel", "Croisette"],
  monaco: ["Casino Row", "Carre d'Or", "Larvotto Front", "Port Hercule"],
};

/** District order around the board (5+4 alternating = 36 lots) */
const DISTRICT_RING: [string, number][] = [
  ["base", 5],
  ["miami", 4],
  ["berlin", 5],
  ["tokyo", 4],
  ["paris", 5],
  ["dubai", 4],
  ["riviera", 5],
  ["monaco", 4],
];

export interface GameTile {
  id: number; // 0..39 clockwise, 0 = top-left corner
  kind: "corner" | "lot";
  cornerLabel?: string;
  district?: string;
  name?: string;
}

/** 11×11 perimeter: 40 tiles, corners at 0/10/20/30. */
export function buildBoard(): GameTile[] {
  const tiles: GameTile[] = [];
  const corners: Record<number, string> = {
    0: "BASE PLAZA",
    10: "AIRPORT",
    20: "CENTRAL PARK",
    30: "EXCHANGE",
  };
  const lots: { district: string; name: string }[] = [];
  for (const [district, count] of DISTRICT_RING) {
    for (let i = 0; i < count; i++) {
      lots.push({ district, name: STREETS[district][i] });
    }
  }
  let lot = 0;
  for (let i = 0; i < 40; i++) {
    if (corners[i] !== undefined) {
      tiles.push({ id: i, kind: "corner", cornerLabel: corners[i] });
    } else {
      tiles.push({ id: i, kind: "lot", ...lots[lot++] });
    }
  }
  return tiles;
}

/** Grid position (col,row on an 11×11 ring) for tile id 0..39. */
export function tileGridPos(id: number): { col: number; row: number } {
  if (id <= 10) return { col: id, row: 0 };
  if (id <= 20) return { col: 10, row: id - 10 };
  if (id <= 30) return { col: 30 - id, row: 10 };
  return { col: 0, row: 40 - id };
}

export function districtOf(id: string): District {
  return DISTRICTS.find((d) => d.id === id) ?? DISTRICTS[0];
}

/* ------------------------------ economy math ----------------------------- */

export function clampHeat(h: number) {
  return Math.min(HEAT_MAX, Math.max(HEAT_MIN, h));
}

/** Current purchase/sale valuation of a lot. */
export function lotValue(baseCost: number, tier: number, heat: number) {
  return Math.round(baseCost * TIER_VALUE[tier] * clampHeat(heat));
}

/** Recommended nightly rate. */
export function nightlyBase(baseCost: number, tier: number, heat: number) {
  return Math.round(baseCost * 0.012 * TIER_NIGHTLY[tier] * clampHeat(heat));
}

/** Expected occupancy 0..0.95 given the player's chosen nightly rate. */
export function occupancy(
  chosenNightly: number,
  baseCost: number,
  tier: number,
  heat: number,
  condition: number
) {
  const recommended = Math.max(1, nightlyBase(baseCost, tier, heat));
  const ratio = chosenNightly / recommended;
  const demand = 0.72 * Math.sqrt(clampHeat(heat));
  const price = ratio <= 1 ? 1 : 1 / (ratio * ratio);
  const cond = condition >= 60 ? 1 : Math.max(0.15, condition / 60);
  return Math.min(0.95, Math.max(0.05, demand * price * cond));
}

/** Net income for one game day of an Airbnb-listed lot. */
export function dailyNet(
  chosenNightly: number,
  baseCost: number,
  tier: number,
  heat: number,
  condition: number
) {
  const occ = occupancy(chosenNightly, baseCost, tier, heat, condition);
  const revenue = chosenNightly * occ;
  const cleaning = revenue * CLEANING_RATE;
  const maintenance = nightlyBase(baseCost, tier, 1) * 0.08;
  return {
    occ,
    revenue,
    cleaning,
    maintenance,
    net: revenue - cleaning - maintenance,
  };
}

export function renovateCost(baseCost: number, condition: number) {
  return Math.max(50, Math.round(baseCost * 0.03 * ((100 - condition) / 100)));
}

export function upgradeCost(baseCost: number, tier: number) {
  return tier >= 3 ? Infinity : Math.round(baseCost * UPGRADE_COST[tier]);
}

export const LOGIN_MESSAGE = (address: string) =>
  `Mortgage Tycoon\nSign in to play\nWallet: ${address}`;
