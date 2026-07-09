export type PropertyStatus = "MINTING" | "SOLD OUT" | "SECONDARY MARKET";

export interface Property {
  id: string; // onchain token id, e.g. MRT-001
  city: string;
  country: string;
  ticker: string;
  description: string;
  coordinates: string; // display-only lat/long, mono
  apy: number; // rental yield %
  funded: number; // 0–100
  priceUsdc: string; // price per fraction
  status: PropertyStatus;
  flagship?: boolean;
  /** Rotation of the compass mark inside the generative card visual */
  markRotation: number;
}

export const properties: Property[] = [
  {
    id: "MRT-001",
    city: "Monaco",
    country: "Principality of Monaco",
    ticker: "$MCO",
    description: "The world's densest square meter, fractionalized.",
    coordinates: "43.7384° N, 7.4246° E",
    apy: 3.8,
    funded: 74,
    priceUsdc: "250.00",
    status: "MINTING",
    flagship: true,
    markRotation: -12,
  },
  {
    id: "MRT-002",
    city: "Paris",
    country: "France",
    ticker: "$PAR",
    description: "16th arrondissement equity, one token away.",
    coordinates: "48.8566° N, 2.3522° E",
    apy: 4.1,
    funded: 58,
    priceUsdc: "180.00",
    status: "MINTING",
    flagship: true,
    markRotation: 24,
  },
  {
    id: "MRT-003",
    city: "Saint-Tropez",
    country: "France",
    ticker: "$STZ",
    description: "Riviera villa, fractionalized.",
    coordinates: "43.2727° N, 6.6407° E",
    apy: 3.5,
    funded: 100,
    priceUsdc: "320.00",
    status: "SOLD OUT",
    markRotation: 8,
  },
  /*
  {
    id: "MRT-004",
    city: "Berlin",
    country: "Germany",
    ticker: "$BER",
    description: "Prenzlauer Berg, onchain.",
    coordinates: "52.5200° N, 13.4050° E",
    apy: 4.6,
    funded: 41,
    priceUsdc: "95.00",
    status: "MINTING",
    markRotation: -30,
  },
  {
    id: "MRT-005",
    city: "Zürich",
    country: "Switzerland",
    ticker: "$ZRH",
    description: "Swiss-grade custody, digital deed.",
    coordinates: "47.3769° N, 8.5417° E",
    apy: 3.2,
    funded: 100,
    priceUsdc: "410.00",
    status: "SECONDARY MARKET",
    markRotation: 45,
  },
  {
    id: "MRT-006",
    city: "Dubai",
    country: "United Arab Emirates",
    ticker: "$DXB",
    description: "Skyline equity, tokenized.",
    coordinates: "25.2048° N, 55.2708° E",
    apy: 5.4,
    funded: 66,
    priceUsdc: "140.00",
    status: "MINTING",
    markRotation: -18,
  },
  {
    id: "MRT-007",
    city: "Miami",
    country: "United States",
    ticker: "$MIA",
    description: "Sunbelt yield, onchain.",
    coordinates: "25.7617° N, 80.1918° W",
    apy: 5.1,
    funded: 100,
    priceUsdc: "175.00",
    status: "SECONDARY MARKET",
    markRotation: 16,
  },
  {
    id: "MRT-008",
    city: "Tokyo",
    country: "Japan",
    ticker: "$TYO",
    description: "Density meets liquidity.",
    coordinates: "35.6762° N, 139.6503° E",
    apy: 4.4,
    funded: 29,
    priceUsdc: "110.00",
    status: "MINTING",
    markRotation: -40,
  },
  */
];
