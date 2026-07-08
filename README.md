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

## Design tokens

Brand palette is defined once as CSS variables in `app/globals.css` and
exposed through the Tailwind theme (`tailwind.config.ts`): `navy`, `compass`,
`ledger`, `coral`, `paper`, `fog`, `grid`. Fonts: Space Grotesk (display),
Inter (body), JetBrains Mono (data).

All motion respects `prefers-reduced-motion`.
