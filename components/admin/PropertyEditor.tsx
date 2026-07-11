"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Trash2,
  XCircle,
} from "lucide-react";
import type { AppProperty } from "@/lib/appSeed";

const input =
  "h-9 w-full rounded border border-grid bg-paper px-2.5 font-mono text-[12px] text-navy placeholder:text-ledger/60 focus:border-compass focus:outline-none";
const label = "mb-1 block font-mono text-[9px] tracking-eyebrow text-ledger";

function blankProperty(n: number): AppProperty {
  return {
    id: `MRT-${String(n).padStart(3, "0")}`,
    slug: `property-${n}`,
    city: "",
    country: "",
    title: "",
    ticker: "$NEW",
    status: "MINTING",
    images: [],
    description: "",
    coordinates: "",
    priceUsdt: 1_000_000,
    tokenPriceUsdt: 100,
    totalTokens: 10_000,
    funded: 0,
    apy: 4,
    feesPct: { tokenization: 2, platform: 1, legalCustody: 0.5 },
    specs: { type: "Apartment", areaM2: 100, bedrooms: 2, bathrooms: 2, built: 2020, tenure: "Freehold via SPV" },
    features: [],
  };
}

function ImageManager({
  images,
  onChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed.");
        return;
      }
      onChange([...images, data.url]);
    } catch {
      setError("Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div>
      <span className={label}>IMAGES ({images.length})</span>
      <div className="flex flex-wrap gap-2">
        {images.map((src, i) => (
          <div key={`${src}-${i}`} className="group relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              className="h-16 w-28 rounded border border-grid object-cover"
            />
            <button
              onClick={() => onChange(images.filter((_, idx) => idx !== i))}
              aria-label="Remove image"
              className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full border border-grid bg-paper text-coral group-hover:flex"
            >
              <Trash2 size={11} strokeWidth={1.75} />
            </button>
          </div>
        ))}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex h-16 w-28 flex-col items-center justify-center gap-1 rounded border border-dashed border-grid text-ledger transition-colors hover:border-compass hover:text-compass disabled:opacity-40"
        >
          {uploading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ImagePlus size={16} strokeWidth={1.5} />
          )}
          <span className="font-mono text-[8px] tracking-eyebrow">UPLOAD</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
      </div>
      <input
        placeholder="…or paste an image URL and press Enter"
        onKeyDown={(e) => {
          const value = (e.target as HTMLInputElement).value.trim();
          if (e.key === "Enter" && value) {
            onChange([...images, value]);
            (e.target as HTMLInputElement).value = "";
          }
        }}
        className={`${input} mt-2`}
      />
      {error && <p className="mt-1.5 font-mono text-[10px] text-coral">{error.toUpperCase()}</p>}
    </div>
  );
}

export default function PropertyEditor() {
  const [items, setItems] = useState<AppProperty[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<{ ok?: string; error?: string }>({});

  useEffect(() => {
    fetch("/api/app/properties", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setItems(d.properties ?? []))
      .catch(() => setState({ error: "Failed to load." }))
      .finally(() => setLoading(false));
  }, []);

  const patch = (id: string, updates: Partial<AppProperty>) =>
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));

  const save = async () => {
    setSaving(true);
    setState({});
    try {
      const res = await fetch("/api/app/properties", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ properties: items }),
      });
      const data = await res.json();
      if (!res.ok) setState({ error: data.error || "Save failed." });
      else setState({ ok: `Saved ${data.count} properties — live now.` });
    } catch {
      setState({ error: "Save failed." });
    } finally {
      setSaving(false);
    }
  };

  const num = (v: string) => Number(v.replace(/[^0-9.]/g, "")) || 0;

  if (loading) return <p className="font-mono text-[11px] text-ledger">LOADING…</p>;

  return (
    <div>
      <h1 className="mb-1 font-display text-3xl text-navy">Properties</h1>
      <p className="mb-6 font-sans text-sm text-ledger">
        Add or edit tokenized listings. Upload photos directly — they are
        stored on the server and served from /api/uploads.
      </p>

      <div className="space-y-3">
        {items.map((p) => (
          <div key={p.id} className="overflow-hidden rounded border border-grid bg-paper">
            <button
              onClick={() => setOpen(open === p.id ? null : p.id)}
              className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left"
            >
              <span className="flex items-baseline gap-3">
                <span className="font-mono text-[11px] text-ledger">{p.id}</span>
                <span className="font-display text-base text-navy">
                  {p.city || "New property"}
                </span>
                <span className="font-mono text-[11px] text-compass">{p.ticker}</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-ledger">{p.status}</span>
                <ChevronDown
                  size={15}
                  className={`text-ledger transition-transform ${open === p.id ? "rotate-180" : ""}`}
                />
              </span>
            </button>

            {open === p.id && (
              <div className="space-y-4 border-t border-grid p-5">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div><span className={label}>ID</span><input value={p.id} onChange={(e) => patch(p.id, { id: e.target.value })} className={input} /></div>
                  <div><span className={label}>CITY</span><input value={p.city} onChange={(e) => patch(p.id, { city: e.target.value })} className={input} /></div>
                  <div><span className={label}>COUNTRY</span><input value={p.country} onChange={(e) => patch(p.id, { country: e.target.value })} className={input} /></div>
                  <div><span className={label}>TICKER</span><input value={p.ticker} onChange={(e) => patch(p.id, { ticker: e.target.value })} className={input} /></div>
                  <div className="sm:col-span-2"><span className={label}>TITLE</span><input value={p.title} onChange={(e) => patch(p.id, { title: e.target.value })} className={input} /></div>
                  <div>
                    <span className={label}>STATUS</span>
                    <select
                      value={p.status}
                      onChange={(e) => patch(p.id, { status: e.target.value as AppProperty["status"] })}
                      className={input}
                    >
                      <option value="MINTING">MINTING</option>
                      <option value="SOLD OUT">SOLD OUT</option>
                      <option value="SECONDARY">SECONDARY</option>
                    </select>
                  </div>
                  <div><span className={label}>COORDINATES</span><input value={p.coordinates} onChange={(e) => patch(p.id, { coordinates: e.target.value })} className={input} /></div>
                  <div><span className={label}>PRICE (USDT)</span><input value={String(p.priceUsdt)} onChange={(e) => patch(p.id, { priceUsdt: num(e.target.value) })} className={input} /></div>
                  <div><span className={label}>TOKEN PRICE</span><input value={String(p.tokenPriceUsdt)} onChange={(e) => patch(p.id, { tokenPriceUsdt: num(e.target.value) })} className={input} /></div>
                  <div><span className={label}>TOTAL TOKENS</span><input value={String(p.totalTokens)} onChange={(e) => patch(p.id, { totalTokens: num(e.target.value) })} className={input} /></div>
                  <div><span className={label}>FUNDED %</span><input value={String(p.funded)} onChange={(e) => patch(p.id, { funded: Math.min(100, num(e.target.value)) })} className={input} /></div>
                  <div><span className={label}>APY %</span><input value={String(p.apy)} onChange={(e) => patch(p.id, { apy: num(e.target.value) })} className={input} /></div>
                  <div><span className={label}>TYPE</span><input value={p.specs.type} onChange={(e) => patch(p.id, { specs: { ...p.specs, type: e.target.value } })} className={input} /></div>
                  <div><span className={label}>AREA M²</span><input value={String(p.specs.areaM2)} onChange={(e) => patch(p.id, { specs: { ...p.specs, areaM2: num(e.target.value) } })} className={input} /></div>
                  <div><span className={label}>BEDROOMS</span><input value={String(p.specs.bedrooms)} onChange={(e) => patch(p.id, { specs: { ...p.specs, bedrooms: num(e.target.value) } })} className={input} /></div>
                  <div><span className={label}>BATHROOMS</span><input value={String(p.specs.bathrooms)} onChange={(e) => patch(p.id, { specs: { ...p.specs, bathrooms: num(e.target.value) } })} className={input} /></div>
                  <div><span className={label}>BUILT</span><input value={String(p.specs.built)} onChange={(e) => patch(p.id, { specs: { ...p.specs, built: num(e.target.value) } })} className={input} /></div>
                  <div><span className={label}>TENURE</span><input value={p.specs.tenure} onChange={(e) => patch(p.id, { specs: { ...p.specs, tenure: e.target.value } })} className={input} /></div>
                </div>

                <div>
                  <span className={label}>DESCRIPTION</span>
                  <textarea
                    value={p.description}
                    onChange={(e) => patch(p.id, { description: e.target.value })}
                    rows={3}
                    className="w-full rounded border border-grid bg-paper px-2.5 py-2 font-sans text-[13px] text-navy focus:border-compass focus:outline-none"
                  />
                </div>

                <div>
                  <span className={label}>FEATURES (COMMA SEPARATED)</span>
                  <input
                    value={p.features.join(", ")}
                    onChange={(e) =>
                      patch(p.id, {
                        features: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    className={input}
                  />
                </div>

                <ImageManager images={p.images} onChange={(images) => patch(p.id, { images })} />

                <button
                  onClick={() => setItems((prev) => prev.filter((x) => x.id !== p.id))}
                  className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-coral underline-offset-2 hover:underline"
                >
                  <Trash2 size={12} strokeWidth={1.75} />
                  DELETE THIS PROPERTY
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          onClick={() => {
            const fresh = blankProperty(items.length + 1);
            setItems((prev) => [...prev, fresh]);
            setOpen(fresh.id);
          }}
          className="btn-ghost !bg-paper"
        >
          <Plus size={15} strokeWidth={1.75} />
          Add property
        </button>
        <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-40">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} strokeWidth={1.75} />}
          Save all
        </button>
      </div>
      {state.error && (
        <p className="mt-3 flex items-center gap-1.5 font-sans text-sm text-coral">
          <XCircle size={14} strokeWidth={1.5} /> {state.error}
        </p>
      )}
      {state.ok && (
        <p className="mt-3 flex items-center gap-1.5 font-sans text-sm text-compass">
          <Check size={14} strokeWidth={1.75} /> {state.ok}
        </p>
      )}
    </div>
  );
}
