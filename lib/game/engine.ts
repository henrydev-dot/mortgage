import { readCollection, writeCollection } from "@/lib/appStore";
import {
  BANK_BUYBACK,
  CONDITION_DECAY_PER_DAY,
  GAME_DAY_MS,
  HEAT_DECAY_PER_DAY,
  HEAT_PER_PURCHASE,
  MARKET_FEE,
  MAX_OFFLINE_DAYS,
  RENOVATE_FLOOR,
  STARTING_BALANCE,
  TIERS,
  buildBoard,
  clampHeat,
  dailyNet,
  districtOf,
  lotValue,
  nightlyBase,
  renovateCost,
  upgradeCost,
} from "./config";

/**
 * Server-side game state + rules. Single-document store ("game"
 * collection) via appStore — MongoDB when configured, file otherwise.
 * Time advances lazily: every state read settles elapsed game days.
 */

export interface LotState {
  id: number;
  district: string;
  name: string;
  tier: number; // 0..3
  condition: number; // 10..100
  owner: string | null; // wallet (lowercase), null = bank
  nightly: number | null; // Airbnb listing, null = not listed
  salePrice: number | null; // marketplace listing
  earnedTotal: number;
}

export interface PlayerState {
  address: string; // lowercase
  balance: number;
  joinedAt: string;
  deposited: number;
  withdrawn: number;
}

export interface GameEvent {
  ts: number;
  text: string;
}

export interface Withdrawal {
  id: string;
  address: string;
  amount: number;
  status: "pending" | "paid" | "rejected";
  ts: string;
}

export interface GameState {
  lots: LotState[];
  players: Record<string, PlayerState>;
  heat: Record<string, number>;
  events: GameEvent[];
  deposits: Record<string, number>; // txHash -> amount credited
  withdrawals: Withdrawal[];
  lastTick: number;
}

function freshState(): GameState {
  const lots: LotState[] = buildBoard()
    .filter((t) => t.kind === "lot")
    .map((t) => ({
      id: t.id,
      district: t.district!,
      name: t.name!,
      tier: 0,
      condition: 100,
      owner: null,
      nightly: null,
      salePrice: null,
      earnedTotal: 0,
    }));
  const heat: Record<string, number> = {};
  for (const lot of lots) heat[lot.district] = 1.0;
  return {
    lots,
    players: {},
    heat,
    events: [{ ts: Date.now(), text: "The city of Mortgage Tycoon opens its gates." }],
    deposits: {},
    withdrawals: [],
    lastTick: Date.now(),
  };
}

export async function loadGame(): Promise<GameState> {
  const [state] = await readCollection<GameState>("game", [freshState()]);
  return state ?? freshState();
}

export async function saveGame(state: GameState) {
  await writeCollection("game", [state]);
}

export function pushEvent(state: GameState, text: string) {
  state.events.unshift({ ts: Date.now(), text });
  state.events = state.events.slice(0, 60);
}

function short(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/* ---------------------------------- tick ---------------------------------- */

/** Settle elapsed game days: income, upkeep, condition, heat decay. */
export function tick(state: GameState, now = Date.now()) {
  const days = Math.min(
    MAX_OFFLINE_DAYS,
    Math.floor((now - state.lastTick) / GAME_DAY_MS)
  );
  if (days <= 0) return;

  for (const district of Object.keys(state.heat)) {
    state.heat[district] = clampHeat(
      state.heat[district] * Math.pow(HEAT_DECAY_PER_DAY, days)
    );
  }

  for (const lot of state.lots) {
    if (!lot.owner) continue;
    const owner = state.players[lot.owner];
    lot.condition = Math.max(RENOVATE_FLOOR, lot.condition - CONDITION_DECAY_PER_DAY * days);
    if (lot.nightly && owner) {
      const heat = state.heat[lot.district] ?? 1;
      const base = districtOf(lot.district).baseCost;
      let net = 0;
      for (let d = 0; d < days; d++) {
        net += dailyNet(lot.nightly, base, lot.tier, heat, lot.condition).net;
      }
      net = Math.round(net);
      if (net !== 0) {
        owner.balance = Math.max(0, owner.balance + net);
        lot.earnedTotal += Math.max(0, net);
        if (net > 0 && days >= 1) {
          pushEvent(
            state,
            `${short(lot.owner)} earned ${net.toLocaleString("en-US")} MRT from guests at ${lot.name}`
          );
        }
      }
    }
  }

  state.lastTick += days * GAME_DAY_MS;
}

/* --------------------------------- players -------------------------------- */

export function ensurePlayer(state: GameState, address: string): PlayerState {
  const key = address.toLowerCase();
  if (!state.players[key]) {
    state.players[key] = {
      address: key,
      balance: STARTING_BALANCE,
      joinedAt: new Date().toISOString(),
      deposited: 0,
      withdrawn: 0,
    };
    pushEvent(state, `${short(key)} moved into the city with ${STARTING_BALANCE.toLocaleString("en-US")} MRT`);
  }
  return state.players[key];
}

export function netWorth(state: GameState, address: string) {
  const key = address.toLowerCase();
  const player = state.players[key];
  if (!player) return 0;
  let worth = player.balance;
  for (const lot of state.lots) {
    if (lot.owner === key) {
      worth += lotValue(districtOf(lot.district).baseCost, lot.tier, state.heat[lot.district] ?? 1);
    }
  }
  return Math.round(worth);
}

/* --------------------------------- actions -------------------------------- */

export type GameAction =
  | { type: "buy"; tileId: number }
  | { type: "airbnb_list"; tileId: number; nightly: number }
  | { type: "airbnb_unlist"; tileId: number }
  | { type: "renovate"; tileId: number }
  | { type: "upgrade"; tileId: number }
  | { type: "sell_list"; tileId: number; price: number }
  | { type: "sell_cancel"; tileId: number }
  | { type: "buy_market"; tileId: number }
  | { type: "bank_sell"; tileId: number };

export function applyAction(
  state: GameState,
  address: string,
  action: GameAction
): { ok: true } | { ok: false; error: string } {
  const key = address.toLowerCase();
  const player = state.players[key];
  if (!player) return { ok: false, error: "Join the game first." };

  const lot = state.lots.find((l) => l.id === action.tileId);
  if (!lot) return { ok: false, error: "Unknown lot." };
  const base = districtOf(lot.district).baseCost;
  const heat = state.heat[lot.district] ?? 1;
  const value = lotValue(base, lot.tier, heat);

  switch (action.type) {
    case "buy": {
      if (lot.owner) return { ok: false, error: "Already owned — check the marketplace." };
      if (player.balance < value) return { ok: false, error: "Insufficient MRT balance." };
      player.balance -= value;
      lot.owner = key;
      lot.condition = 100;
      state.heat[lot.district] = clampHeat(heat + HEAT_PER_PURCHASE);
      pushEvent(state, `${short(key)} bought ${lot.name} for ${value.toLocaleString("en-US")} MRT`);
      return { ok: true };
    }
    case "airbnb_list": {
      if (lot.owner !== key) return { ok: false, error: "Not your property." };
      const nightly = Math.round(action.nightly);
      const max = nightlyBase(base, lot.tier, heat) * 4;
      if (!Number.isFinite(nightly) || nightly < 1 || nightly > max) {
        return { ok: false, error: `Nightly rate must be 1–${max.toLocaleString("en-US")} MRT.` };
      }
      lot.nightly = nightly;
      lot.salePrice = null;
      pushEvent(state, `${lot.name} is now on Airbnb at ${nightly.toLocaleString("en-US")} MRT/night`);
      return { ok: true };
    }
    case "airbnb_unlist": {
      if (lot.owner !== key) return { ok: false, error: "Not your property." };
      lot.nightly = null;
      return { ok: true };
    }
    case "renovate": {
      if (lot.owner !== key) return { ok: false, error: "Not your property." };
      const cost = renovateCost(base, lot.condition);
      if (lot.condition >= 100) return { ok: false, error: "Already in perfect condition." };
      if (player.balance < cost) return { ok: false, error: "Insufficient MRT balance." };
      player.balance -= cost;
      lot.condition = 100;
      pushEvent(state, `${short(key)} renovated ${lot.name} for ${cost.toLocaleString("en-US")} MRT`);
      return { ok: true };
    }
    case "upgrade": {
      if (lot.owner !== key) return { ok: false, error: "Not your property." };
      const cost = upgradeCost(base, lot.tier);
      if (!Number.isFinite(cost)) return { ok: false, error: "Already a Tower." };
      if (player.balance < cost) return { ok: false, error: "Insufficient MRT balance." };
      player.balance -= cost;
      lot.tier += 1;
      pushEvent(
        state,
        `${lot.name} upgraded to ${TIERS[lot.tier]} by ${short(key)} (${cost.toLocaleString("en-US")} MRT)`
      );
      return { ok: true };
    }
    case "sell_list": {
      if (lot.owner !== key) return { ok: false, error: "Not your property." };
      const price = Math.round(action.price);
      if (!Number.isFinite(price) || price < 100 || price > value * 10) {
        return { ok: false, error: "Price must be between 100 and 10× value." };
      }
      lot.salePrice = price;
      lot.nightly = null;
      pushEvent(state, `${lot.name} listed on the marketplace for ${price.toLocaleString("en-US")} MRT`);
      return { ok: true };
    }
    case "sell_cancel": {
      if (lot.owner !== key) return { ok: false, error: "Not your property." };
      lot.salePrice = null;
      return { ok: true };
    }
    case "buy_market": {
      if (!lot.owner || lot.salePrice === null) return { ok: false, error: "Not for sale." };
      if (lot.owner === key) return { ok: false, error: "You already own this." };
      if (player.balance < lot.salePrice) return { ok: false, error: "Insufficient MRT balance." };
      const seller = state.players[lot.owner];
      const fee = Math.round(lot.salePrice * MARKET_FEE);
      player.balance -= lot.salePrice;
      if (seller) seller.balance += lot.salePrice - fee;
      pushEvent(
        state,
        `${short(key)} bought ${lot.name} from ${short(lot.owner)} for ${lot.salePrice.toLocaleString("en-US")} MRT`
      );
      lot.owner = key;
      lot.salePrice = null;
      lot.nightly = null;
      state.heat[lot.district] = clampHeat(heat + HEAT_PER_PURCHASE);
      return { ok: true };
    }
    case "bank_sell": {
      if (lot.owner !== key) return { ok: false, error: "Not your property." };
      const payout = Math.round(value * BANK_BUYBACK);
      player.balance += payout;
      pushEvent(state, `${short(key)} sold ${lot.name} back to the bank for ${payout.toLocaleString("en-US")} MRT`);
      lot.owner = null;
      lot.nightly = null;
      lot.salePrice = null;
      lot.tier = Math.max(0, lot.tier);
      return { ok: true };
    }
    default:
      return { ok: false, error: "Unknown action." };
  }
}
