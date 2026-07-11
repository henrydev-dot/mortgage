/**
 * Seed data + static config for the dapp. Used as the initial dataset
 * when MongoDB is not configured (or a collection is empty). Everything
 * here is editable from /admin once the app is running.
 */

/* ------------------------------ properties ------------------------------ */

export interface AppProperty {
  id: string; // MRT-001
  slug: string;
  city: string;
  country: string;
  title: string;
  ticker: string;
  status: "MINTING" | "SOLD OUT" | "SECONDARY";
  images: string[];
  description: string;
  coordinates: string;
  priceUsdt: number; // asset price
  tokenPriceUsdt: number;
  totalTokens: number;
  funded: number; // 0-100
  apy: number;
  feesPct: { tokenization: number; platform: number; legalCustody: number };
  specs: {
    type: string;
    areaM2: number;
    bedrooms: number;
    bathrooms: number;
    built: number;
    tenure: string;
  };
  features: string[];
}

export const seedProperties: AppProperty[] = [
  {
    id: "MRT-001",
    slug: "monaco-carre-dor",
    city: "Monaco",
    country: "Principality of Monaco",
    title: "Carré d'Or Residence",
    ticker: "$MCO",
    status: "MINTING",
    images: [
      "/properties/monaco-1.svg",
      "/properties/monaco-2.svg",
      "/properties/monaco-3.svg",
    ],
    description:
      "A 3-bedroom residence one block from Casino Square — the world's densest square meter, fractionalized. Fully renovated in 2024, managed by a licensed Monegasque agency, and rented on a corporate lease with annual indexation.",
    coordinates: "43.7384° N, 7.4246° E",
    priceUsdt: 8_400_000,
    tokenPriceUsdt: 250,
    totalTokens: 34_944,
    funded: 74,
    apy: 3.8,
    feesPct: { tokenization: 2.0, platform: 1.0, legalCustody: 0.5 },
    specs: {
      type: "Apartment",
      areaM2: 168,
      bedrooms: 3,
      bathrooms: 3,
      built: 1998,
      tenure: "Freehold via SPV",
    },
    features: [
      "Casino Square 150m",
      "Concierge & valet",
      "Sea-view terrace",
      "Corporate lease until 2029",
      "Renovated 2024",
      "2 parking bays",
    ],
  },
  {
    id: "MRT-002",
    slug: "paris-16th-haussmann",
    city: "Paris",
    country: "France",
    title: "Avenue Foch Haussmannien",
    ticker: "$PAR",
    status: "MINTING",
    images: [
      "/properties/paris-1.svg",
      "/properties/paris-2.svg",
      "/properties/paris-3.svg",
    ],
    description:
      "16th arrondissement equity, one token away. A classic Haussmann floor-through on Avenue Foch with 3.4m ceilings, herringbone parquet, and a long-term diplomatic tenancy producing indexed EUR rent, settled to holders in USDT.",
    coordinates: "48.8566° N, 2.3522° E",
    priceUsdt: 5_950_000,
    tokenPriceUsdt: 180,
    totalTokens: 34_611,
    funded: 58,
    apy: 4.1,
    feesPct: { tokenization: 2.0, platform: 1.0, legalCustody: 0.5 },
    specs: {
      type: "Apartment",
      areaM2: 212,
      bedrooms: 4,
      bathrooms: 3,
      built: 1892,
      tenure: "Freehold via SPV",
    },
    features: [
      "Avenue Foch address",
      "3.4m ceilings",
      "Herringbone parquet",
      "Diplomatic tenancy",
      "Cellar + chambre de bonne",
      "Elevator building",
    ],
  },
  {
    id: "MRT-003",
    slug: "saint-tropez-villa",
    city: "Saint-Tropez",
    country: "France",
    title: "Les Parcs Villa",
    ticker: "$STZ",
    status: "SOLD OUT",
    images: [
      "/properties/sttropez-1.svg",
      "/properties/sttropez-2.svg",
      "/properties/sttropez-3.svg",
    ],
    description:
      "Riviera villa inside the gated Les Parcs de Saint-Tropez estate. Fully funded — tokens trade on the secondary market once live. Seasonal luxury lettings produce peak-summer yield distributed quarterly.",
    coordinates: "43.2727° N, 6.6407° E",
    priceUsdt: 12_800_000,
    tokenPriceUsdt: 320,
    totalTokens: 41_400,
    funded: 100,
    apy: 3.5,
    feesPct: { tokenization: 2.0, platform: 1.0, legalCustody: 0.5 },
    specs: {
      type: "Villa",
      areaM2: 420,
      bedrooms: 6,
      bathrooms: 7,
      built: 2009,
      tenure: "Freehold via SPV",
    },
    features: [
      "Gated Les Parcs estate",
      "Heated pool + pool house",
      "Sea view",
      "Staff quarters",
      "Seasonal lettings program",
      "5,800 m² grounds",
    ],
  },
];

/* -------------------------------- staking ------------------------------- */

export interface StakePool {
  id: string;
  name: string;
  pair: string[]; // ["MRT"] or ["MRT","USDT"]
  apr: number;
  lockDays: number;
  minStake: number;
  tvlMrt: number;
  contract: string; // filled later by the team
  active: boolean;
  description: string;
}

export const seedPools: StakePool[] = [
  {
    id: "mrt-single",
    name: "MRT Staking",
    pair: ["MRT"],
    apr: 18.5,
    lockDays: 30,
    minStake: 1_000,
    tvlMrt: 14_200_000,
    contract: "",
    active: true,
    description:
      "Single-sided MRT staking. Rewards stream per block from the protocol fee pool; principal unlocks after the lock period.",
  },
  {
    id: "mrt-usdt-lp",
    name: "MRT-USDT LP",
    pair: ["MRT", "USDT"],
    apr: 32.0,
    lockDays: 60,
    minStake: 500,
    tvlMrt: 6_800_000,
    contract: "",
    active: true,
    description:
      "Provide MRT-USDT liquidity and stake the LP token. Higher APR for deeper liquidity — subject to impermanent loss.",
  },
];

/* ------------------------------ buy & burn ------------------------------ */

export interface BurnEvent {
  id: string;
  date: string; // ISO
  amountMrt: number;
  usdtSpent: number;
  tx: string; // tx hash or empty until onchain
}

export const seedBurns: BurnEvent[] = [
  { id: "burn-5", date: "2026-07-01", amountMrt: 1_450_000, usdtSpent: 52_200, tx: "" },
  { id: "burn-4", date: "2026-06-01", amountMrt: 1_210_000, usdtSpent: 41_140, tx: "" },
  { id: "burn-3", date: "2026-05-01", amountMrt: 980_000, usdtSpent: 30_380, tx: "" },
  { id: "burn-2", date: "2026-04-01", amountMrt: 760_000, usdtSpent: 21_280, tx: "" },
  { id: "burn-1", date: "2026-03-01", amountMrt: 500_000, usdtSpent: 12_500, tx: "" },
];

/* -------------------------------- escrow -------------------------------- */

export interface EscrowAgent {
  id: string;
  alias: string;
  wallet: string;
  feePct: number;
  casesResolved: number;
  specialties: string[];
  contact: string; // tg/x handle or email
  bio: string;
  joined: string; // ISO
  status: "approved" | "pending" | "rejected";
}

export const seedEscrowAgents: EscrowAgent[] = [
  {
    id: "esc-1",
    alias: "BaseArbiter",
    wallet: "0x51A1ceB83B83F1985a81C295d1fF28Afef186E02",
    feePct: 1.0,
    casesResolved: 41,
    specialties: ["OTC deals", "Token sales"],
    contact: "@basearbiter",
    bio: "Full-time onchain arbiter since 2024. Multisig-first process, written rulings.",
    joined: "2026-03-12",
    status: "approved",
  },
  {
    id: "esc-2",
    alias: "NotaryDAO",
    wallet: "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
    feePct: 1.5,
    casesResolved: 27,
    specialties: ["RWA transfers", "Deed disputes"],
    contact: "@notarydao",
    bio: "Legal-tech collective specialising in tokenized real-estate settlement.",
    joined: "2026-04-02",
    status: "approved",
  },
  {
    id: "esc-3",
    alias: "MedianEth",
    wallet: "0x1D96F2f6BeF1202E4Ce1Ff6Dad0c2CB002861d3e",
    feePct: 0.8,
    casesResolved: 63,
    specialties: ["P2P trades", "Freelance milestones"],
    contact: "median@skiff.com",
    bio: "High-volume, low-fee escrow for retail-size deals. 24h response SLA.",
    joined: "2026-02-20",
    status: "approved",
  },
];

/* ---------------------------------- DAO --------------------------------- */

export interface DaoProposal {
  id: string;
  title: string;
  summary: string;
  author: string; // wallet
  createdAt: string;
  endsAt: string;
  baseFor: number; // seeded tallies (MRT)
  baseAgainst: number;
}

export const DAO_CONFIG = {
  /** MRT required to create a proposal */
  proposalThreshold: 100_000,
  /** MRT total FOR+AGAINST required for a proposal to be valid */
  quorum: 5_000_000,
  votingDays: 5,
};

export const seedProposals: DaoProposal[] = [
  {
    id: "MIP-3",
    title: "List Dubai Marina tower as MRT-004",
    summary:
      "Acquire and tokenize a 22-unit block in Dubai Marina at 9.2M USDT. Projected net yield 5.4%. SPV in DIFC, custody with the existing provider.",
    author: "0x51A1ceB83B83F1985a81C295d1fF28Afef186E02",
    createdAt: "2026-07-06T12:00:00.000Z",
    endsAt: "2026-07-20T12:00:00.000Z",
    baseFor: 3_400_000,
    baseAgainst: 620_000,
  },
  {
    id: "MIP-2",
    title: "Raise buy-&-burn allocation to 30% of protocol fees",
    summary:
      "Increase the monthly buyback budget from 20% to 30% of collected protocol fees, effective next epoch.",
    author: "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
    createdAt: "2026-06-10T12:00:00.000Z",
    endsAt: "2026-06-24T12:00:00.000Z",
    baseFor: 6_100_000,
    baseAgainst: 1_900_000,
  },
  {
    id: "MIP-1",
    title: "Adopt USDT as the default settlement currency",
    summary:
      "Settle rental yield and secondary trades in USDT instead of USDC across all properties.",
    author: "0x1D96F2f6BeF1202E4Ce1Ff6Dad0c2CB002861d3e",
    createdAt: "2026-05-01T12:00:00.000Z",
    endsAt: "2026-05-15T12:00:00.000Z",
    baseFor: 7_800_000,
    baseAgainst: 450_000,
  },
];

export interface DaoVote {
  proposalId: string;
  address: string; // lowercase
  support: boolean;
  weight: number; // MRT at vote time
  ts: string;
}

/* ------------------------------ app config ------------------------------ */

export interface AppConfig {
  /** Treasury address that receives property reservation payments */
  treasuryAddress: string;
  /** Reservation amount when paying in USDT */
  startAmountUsdt: number;
  /** Reservation amount when paying in ETH */
  startAmountEth: number;
  /** USDT token contract on Base */
  usdtAddress: string;
  /** Deployed MortgageStaking contract (empty = in audit) */
  stakingContract: string;
  /** Deployed MortgageLending contract (empty = in audit) */
  lendingContract: string;
}

export const defaultConfig: AppConfig = {
  treasuryAddress: "",
  startAmountUsdt: 100,
  startAmountEth: 0.03,
  usdtAddress: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
  stakingContract: "",
  lendingContract: "",
};

/* ------------------------------ reservations ---------------------------- */

export interface Order {
  id: string;
  propertyId: string;
  address: string; // payer wallet
  txHash: string;
  amount: number;
  currency: "USDT" | "ETH";
  ts: string;
  ip?: string;
}

/* ------------------------------ lend/borrow ----------------------------- */

export interface LendMarket {
  symbol: string;
  name: string;
  priceUsd: number; // reference price used by the calculator
  maxLtv: number; // 0-1
  liqThreshold: number; // 0-1
  aprPct: number; // borrow APR against this collateral
}

export const lendMarkets: LendMarket[] = [
  { symbol: "ETH", name: "Ethereum", priceUsd: 4_850, maxLtv: 0.75, liqThreshold: 0.8, aprPct: 7.9 },
  { symbol: "cbBTC", name: "Coinbase Wrapped BTC", priceUsd: 118_400, maxLtv: 0.7, liqThreshold: 0.75, aprPct: 7.2 },
  { symbol: "cbETH", name: "Coinbase Wrapped Staked ETH", priceUsd: 5_240, maxLtv: 0.72, liqThreshold: 0.77, aprPct: 8.4 },
  { symbol: "wSOL", name: "Wrapped Solana", priceUsd: 212, maxLtv: 0.6, liqThreshold: 0.65, aprPct: 10.5 },
  { symbol: "USDC", name: "USD Coin", priceUsd: 1, maxLtv: 0.85, liqThreshold: 0.9, aprPct: 6.5 },
  { symbol: "MRT", name: "Mortgage Estate", priceUsd: 0.036, maxLtv: 0.4, liqThreshold: 0.5, aprPct: 12.0 },
];

export const LOAN_TERMS_MONTHS = [6, 12, 24, 36];
