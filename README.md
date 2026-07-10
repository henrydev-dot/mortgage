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

## Airdrop

`/airdrop` distributes 1,000 MRT per verified application (+200 MRT to the
referrer for every referred claim), sent automatically from the treasury
wallet over the Base public RPC.

Setup:

1. Copy `.env.example` to `.env` and set `AIRDROP_PRIVATE_KEY` to the
   treasury wallet's private key. The wallet must hold MRT
   (`0xb200000000000000000000d8b21449ecf586c801`) and a little ETH on Base
   for gas.
2. Optionally set `AIRDROP_RPC_URL` to a private RPC; it defaults to
   `https://mainnet.base.org`.
3. Claims are recorded in `claims.json` (one claim per wallet, referral
   counts, tx hashes). Mount/persist this file in production if you want
   claim history to survive redeploys.

Amounts, task links, and the token address live in `lib/airdrop.ts`.

## Design tokens

Brand palette is defined once as CSS variables in `app/globals.css` and
exposed through the Tailwind theme (`tailwind.config.ts`): `navy`, `compass`,
`ledger`, `coral`, `paper`, `fog`, `grid`. Fonts: Space Grotesk (display),
Inter (body), JetBrains Mono (data).

All motion respects `prefers-reduced-motion`.
