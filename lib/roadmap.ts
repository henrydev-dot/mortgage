export interface RoadmapItem {
  quarter: string;
  title: string;
  points: string[];
  done: boolean;
  current?: boolean;
}

export const roadmap: RoadmapItem[] = [
  {
    quarter: "Q1 2026",
    title: "Protocol genesis",
    points: ["SPV legal framework", "Base mainnet contracts audited", "Custody partnerships signed"],
    done: true,
  },
  {
    quarter: "Q2 2026",
    title: "First mints",
    points: ["Monaco & Paris flagship listings", "KYC onboarding live", "First yield distribution"],
    done: true,
  },
  {
    quarter: "Q3 2026",
    title: "Secondary market",
    points: ["Onchain orderbook launch", "8 cities live", "Institutional custody tier"],
    done: false,
    current: true,
  },
  {
    quarter: "Q4 2026",
    title: "Yield vaults",
    points: ["Diversified city baskets", "Automated re-balancing", "Mobile app beta"],
    done: false,
  },
  {
    quarter: "Q1 2027",
    title: "Global expansion",
    points: ["APAC & MENA listings", "Cross-chain settlement via LayerZero", "DAO governance rollout"],
    done: false,
  },
];
