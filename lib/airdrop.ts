/**
 * Airdrop configuration — single source of truth for the /airdrop page
 * and the /api/airdrop distribution endpoint.
 */

export const MRT_TOKEN = {
  address: "0xb200000000000000000000d8b21449ecf586c801" as const,
  symbol: "MRT",
  decimals: 18,
  /** Shown by MetaMask when the token is added to the wallet */
  image: "https://b20mortgage.com/brand/mark.png",
};

export const AIRDROP = {
  /** MRT sent to every approved application */
  claimAmount: 1000,
  /** MRT sent to the referrer each time a referred wallet claims */
  referralBonus: 200,
};

export const BASE_CHAIN = {
  id: 8453,
  hexId: "0x2105",
  name: "Base",
  rpcUrl: "https://mainnet.base.org",
  explorer: "https://basescan.org",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
};

export const SITE_URL = "https://b20mortgage.com";

export const SOCIALS = {
  twitter: "https://x.com/BasedMortgage",
  twitterHandle: "@BasedMortgage",
  telegram: "https://t.me/basedMortgage",
  medium: "https://b20mortgage.medium.com/",
};

export function referralLink(address: string) {
  return `${SITE_URL}/airdrop?ref=${address}`;
}

/** Prefilled tweet for the "Post on X" task */
export function tweetIntentUrl(refAddress?: string) {
  const link = refAddress ? referralLink(refAddress) : `${SITE_URL}/airdrop`;
  const text = `Real estate, tokenized. Claiming 1,000 $MRT from ${SOCIALS.twitterHandle} on @base — fractional property ownership, settled onchain.\n\nClaim yours: ${link}`;
  return `https://x.com/intent/post?text=${encodeURIComponent(text)}`;
}

/**
 * Deep link that reopens the current page inside the MetaMask mobile
 * app's browser — the only reliable way to trigger watchAsset on a
 * phone without an injected provider. Client-side only.
 */
export function metamaskDappLink() {
  const { host, pathname, search } = window.location;
  return `https://metamask.app.link/dapp/${host}${pathname}${search}`;
}

export function isValidAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

export function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
