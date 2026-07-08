import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";

interface PaperViewerProps {
  title: string;
  meta: string;
  file: string;
}

/** Shared document-viewer page shell for /whitepaper and /lightpaper. */
export default function PaperViewer({ title, meta, file }: PaperViewerProps) {
  return (
    <div className="flex min-h-screen flex-col bg-fog">
      <header className="border-b border-grid bg-paper">
        <div className="container-line flex h-16 items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-sans text-sm text-navy transition-colors hover:text-compass"
          >
            <ArrowLeft size={16} strokeWidth={1.75} />
            Back to site
          </Link>
          <img src="/brand/logo.png" alt="Mortgage Estate" className="h-6 w-auto" />
          <a href={file} download className="btn-ghost !px-4 !py-2">
            <Download size={14} strokeWidth={1.75} />
            Download
          </a>
        </div>
      </header>

      <div className="container-line flex-1 py-10">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="font-display text-3xl tracking-tight text-navy">{title}</h1>
          <p className="font-mono text-[11px] tracking-wider text-ledger">{meta}</p>
        </div>
        <iframe
          src={file}
          title={`${title} PDF`}
          className="h-[78vh] w-full rounded border border-grid bg-paper"
        />
        <p className="mt-4 font-sans text-xs text-ledger">
          Viewer not loading?{" "}
          <a href={file} className="text-compass underline" download>
            Download the PDF directly.
          </a>
        </p>
      </div>
    </div>
  );
}
