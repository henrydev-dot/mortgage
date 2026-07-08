import { ArrowRight } from "lucide-react";
import type { Property } from "@/lib/properties";

function StatusPill({ status }: { status: Property["status"] }) {
  if (status === "MINTING") {
    return (
      <span className="flex items-center gap-1.5 rounded border border-coral/40 bg-navy/70 px-2 py-1 font-mono text-[10px] tracking-eyebrow text-coral backdrop-blur-sm">
        <span className="pulse-dot h-1 w-1 rounded-full bg-coral" />
        MINTING
      </span>
    );
  }
  if (status === "SOLD OUT") {
    return (
      <span className="rounded border border-paper/20 bg-navy/70 px-2 py-1 font-mono text-[10px] tracking-eyebrow text-ledger backdrop-blur-sm">
        SOLD OUT
      </span>
    );
  }
  return (
    <span className="rounded border border-compass/50 bg-navy/70 px-2 py-1 font-mono text-[10px] tracking-eyebrow text-[#7fa8e0] backdrop-blur-sm">
      SECONDARY MARKET
    </span>
  );
}

/** Thin viewfinder ticks in the visual's corners — reads as "surveyed / verified". */
function CornerTicks() {
  const tick = "absolute h-3 w-3 border-paper/30 transition-colors duration-500 group-hover/card:border-compass";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-3">
      <span className={`${tick} left-0 top-0 border-l border-t`} />
      <span className={`${tick} right-0 top-0 border-r border-t`} />
      <span className={`${tick} bottom-0 left-0 border-b border-l`} />
      <span className={`${tick} bottom-0 right-0 border-b border-r`} />
    </div>
  );
}

export default function PropertyCard({
  property,
  featured = false,
}: {
  property: Property;
  featured?: boolean;
}) {
  const p = property;

  return (
    <article className="group/card flex flex-col rounded border border-grid bg-paper transition-colors duration-300 hover:border-compass/60">
      {/* Generative visual field — deep-navy ledger plane with the compass mark */}
      <div
        className={`relative overflow-hidden rounded-t border-b border-grid bg-navy ${
          featured ? "aspect-[16/9]" : "aspect-[16/10]"
        }`}
      >
        {/* Fine blueprint grid, brightens toward compass blue on hover */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.14] transition-opacity duration-500 group-hover/card:opacity-[0.28]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(231,233,237,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(231,233,237,0.9) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        {/* Compass-blue field rises in on hover — the duotone→color shift */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
          style={{
            background:
              "radial-gradient(120% 120% at 80% 0%, rgba(39,92,171,0.55), transparent 70%)",
          }}
        />
        {/* The Mortgage Estate compass mark — each city gets its own bearing */}
        <img
          src="/brand/mark.svg"
          alt=""
          aria-hidden
          className={`absolute opacity-20 transition-all duration-500 group-hover/card:opacity-60 ${
            featured ? "-right-10 -top-12 h-56 w-56" : "-right-8 -top-9 h-40 w-40"
          }`}
          style={{
            filter: "brightness(0) invert(1)",
            transform: `rotate(${p.markRotation}deg)`,
          }}
        />
        <CornerTicks />

        {/* Verification scanline — sweeps once per hover-enter */}
        <div
          aria-hidden
          className="scanline absolute left-0 h-[2px] w-full bg-compass opacity-0 shadow-[0_0_12px_2px_rgba(39,92,171,0.7)]"
          style={{ top: "-4px" }}
        />

        <span className="absolute left-3 top-3 rounded border border-paper/20 bg-navy/70 px-2 py-1 font-mono text-[10px] tracking-eyebrow text-paper/70 backdrop-blur-sm">
          {p.id}
        </span>
        <div className="absolute right-3 top-3">
          <StatusPill status={p.status} />
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <p className="font-mono text-[10px] tracking-eyebrow text-paper/50">
            {p.coordinates}
          </p>
          {featured && (
            <p className={`mt-2 font-display text-paper text-3xl md:text-4xl`}>
              {p.city}{" "}
              <span className="font-mono text-base text-paper/50">{p.ticker}</span>
            </p>
          )}
        </div>
      </div>

      <div className={`flex flex-1 flex-col ${featured ? "p-6" : "p-5"}`}>
        {!featured && (
          <h3 className="font-display text-xl text-navy">
            {p.city}{" "}
            <span className="font-mono text-xs text-ledger">{p.ticker}</span>
          </h3>
        )}
        {featured && (
          <p className="font-mono text-[10px] tracking-eyebrow text-compass">
            FLAGSHIP LISTING · {p.country.toUpperCase()}
          </p>
        )}
        <p className={`font-sans text-sm leading-relaxed text-ledger ${featured ? "mt-3 text-base" : "mt-1.5"}`}>
          {p.description}
        </p>

        <div className="mt-auto pt-5">
          <div className="flex items-baseline justify-between font-mono text-sm text-navy">
            <span>{p.apy.toFixed(1)}% APY</span>
            <span className="text-ledger">{p.funded}% funded</span>
          </div>
          <div className="mt-2 h-px w-full bg-grid">
            <div className="h-px bg-compass" style={{ width: `${p.funded}%` }} />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="font-mono text-xs text-ledger">
              {p.priceUsdc} USDC
            </span>
            <a href="#" className="arrow-link">
              View Property
              <ArrowRight size={14} strokeWidth={1.75} />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
