# Mortgage Estate — Landing Page

Real-world-asset tokenization protocol on Base. Marketing landing page built
with Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, GSAP
(ScrollTrigger) and Lenis smooth scrolling.

## Development

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # static export to ./out
```

The build is a fully static export (`output: "export"`), deployable to any
static host or Vercel.

## Structure

- `app/` — routes: `/`, `/whitepaper`, `/lightpaper` (PDF viewers)
- `components/` — Header, Hero (PixelGrid canvas), EcosystemStrip,
  PropertyGrid/PropertyCard, InvestmentMethods, StatsStrip, WhyUs, Roadmap,
  PapersSection, FAQ, FinalCTA, Footer, Watermark
- `lib/` — swappable content data: `properties.ts`, `partners.ts`, `faq.ts`,
  `roadmap.ts`, `stats.ts`
- `public/brand/` — Mortgage Estate logo lockups and compass mark
- `public/partners/` — partner logos (monochrome SVGs, tinted via CSS)
- `public/docs/` — lightpaper/whitepaper PDFs (placeholders; drop in the
  real files with the same names)

## App (dapp)

`/app` is the web3 application (English UI, RainbowKit wallet connect,
Base network). Sections: Properties (tokenized listings + USDT fee
breakdown), Stake (MRT + MRT-USDT pools, admin-editable, contract
address pluggable), Lend (collateralized USDT borrow calculator with
monthly/at-maturity repayment), Buy & Burn ledger, Escrow agent
directory + registration, and DAO (wallet-signed, MRT-balance-weighted
voting and proposals).

Data: set `MONGODB_URI` to persist collections in MongoDB; without it,
data lives in `app-data-*.json` files seeded from `lib/appSeed.ts`.
Admin editors live under `/admin` (set `ADMIN_KEY` to lock writes).

Subdomain: `middleware.ts` rewrites `app.b20mortgage.com/*` to `/app/*`
— point the subdomain at the same deployment and it just works.

## Airdrop

`/airdrop` collects applications for 1,000 MRT per wallet (+200 MRT to the
referrer per referred application). Distribution is manual: applications
are stored in `airdrop-applications.json` and listed at `/admin/airdrop`
with per-wallet payout amounts — you send the MRT from the treasury
yourself after review.

Wallet connection uses RainbowKit (MetaMask, Coinbase Wallet,
WalletConnect QR/deep links for mobile). Set
`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` in `.env` (free ID from
https://cloud.reown.com) to enable mobile WalletConnect; extension
wallets work without it. "Add MRT to wallet" goes through the connected
wallet's `watchAsset`, with manual token details shown as a fallback.

Persist `airdrop-applications.json` (volume) in production if you want
applications to survive redeploys. Amounts, task links, and the token
address live in `lib/airdrop.ts`.

## Design tokens

Brand palette is defined once as CSS variables in `app/globals.css` and
exposed through the Tailwind theme (`tailwind.config.ts`): `navy`, `compass`,
`ledger`, `coral`, `paper`, `fog`, `grid`. Fonts: Space Grotesk (display),
Inter (body), JetBrains Mono (data).

All motion respects `prefers-reduced-motion`.
