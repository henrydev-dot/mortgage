import { properties } from "@/lib/properties";
import PropertyCard from "./PropertyCard";
import Reveal from "./Reveal";

export default function PropertyGrid() {
  const flagships = properties.filter((p) => p.flagship);
  const rest = properties.filter((p) => !p.flagship);

  return (
    <section id="properties" className="scroll-mt-16 py-24 md:py-32">
      <div className="container-line">
        <Reveal>
          <p className="eyebrow mb-4">PORTFOLIO · 8 CITIES ONCHAIN</p>
        </Reveal>
        <Reveal index={1}>
          <div className="flex flex-wrap items-end justify-between gap-6 border-b border-grid pb-10">
            <h2 className="max-w-xl font-display text-4xl tracking-tight text-navy md:text-5xl">
              Addresses the world
              <br />
              competes for.
            </h2>
            <p className="max-w-sm font-sans text-sm leading-relaxed text-ledger">
              Every property is held by a regulated SPV, audited independently,
              and mirrored onchain as a fractional token on Base.
            </p>
          </div>
        </Reveal>

        {/* Flagships — Monaco & Paris, wider feature slots */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {flagships.map((p, i) => (
            <Reveal key={p.id} index={i}>
              <PropertyCard property={p} featured />
            </Reveal>
          ))}
        </div>

        {/* Standard grid — horizontal scroll-snap carousel on mobile */}
        <div className="mt-6 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 xl:grid-cols-4">
          {rest.map((p, i) => (
            <Reveal
              key={p.id}
              index={i}
              className="w-[78vw] shrink-0 snap-start sm:w-[52vw] md:w-auto"
            >
              <PropertyCard property={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
