export interface Partner {
  name: string;
  logo: string; // path under /public
}

export const partners: Partner[] = [
  { name: "Chainlink", logo: "/partners/chainlink.svg" },
  { name: "LayerZero", logo: "/partners/layerzero.svg" },
  { name: "Crossmint", logo: "/partners/crossmint.svg" },
  { name: "Stripe", logo: "/partners/stripe.svg" },
  { name: "Alchemy", logo: "/partners/alchemy.svg" },
  { name: "Wormhole", logo: "/partners/wormhole.svg" },
  { name: "0x", logo: "/partners/0x.svg" },
  { name: "Aave", logo: "/partners/aave.svg" },
  { name: "Morpho", logo: "/partners/morpho.svg" },
  { name: "Phantom", logo: "/partners/phantom.svg" },
];
