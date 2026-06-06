"use client";

import { useState } from "react";
import {
  FileArchive,
  FileJson,
  FileSpreadsheet,
  FileText,
  Download,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getDeliverableDescription,
  getDeliverableDisplayName,
} from "@/lib/deliverables/descriptions";
import { formatFileSize } from "@/lib/deliverables/parse-records";
import type { DeliverableRecord } from "@/lib/deliverables/types";

type DeliverablesGridProps = {
  packageName: string;
  deliveredAt: Date | string | null;
  deliverables: DeliverableRecord[];
};

type FileIconKind = "pdf" | "xlsx" | "zip" | "md" | "json";

function resolveFileIconKind(record: DeliverableRecord): FileIconKind {
  const name = record.name.toLowerCase();
  if (record.type === "xlsx" || name.endsWith(".xlsx") || record.key === "roi-calculator")
    return "xlsx";
  if (record.type === "zip" || name.endsWith(".zip")) return "zip";
  if (record.type === "json" || name.endsWith(".json")) return "json";
  if (record.type === "markdown" || name.endsWith(".md")) return "md";
  return "pdf";
}

function FileTypeIcon({ kind }: { kind: FileIconKind }) {
  const className = "h-8 w-8 text-accent-light";
  switch (kind) {
    case "json":
      return <FileJson className={className} aria-hidden />;
    case "xlsx":
      return <FileSpreadsheet className={className} aria-hidden />;
    case "zip":
      return <FileArchive className={className} aria-hidden />;
    case "md":
      return <FileText className={className} aria-hidden />;
    default:
      return <FileText className={className} aria-hidden />;
  }
}

function formatDeliveredDate(value: Date | string | null): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

async function fetchDownloadUrl(key: string): Promise<string> {
  const response = await fetch(
    `/api/deliverables/download?key=${encodeURIComponent(key)}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(body.error ?? "Download failed");
  }

  const data = (await response.json()) as { url: string };
  return data.url;
}

function DeliverableCard({ record }: { record: DeliverableRecord }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iconKind = resolveFileIconKind(record);
  const displayName = getDeliverableDisplayName(record.key, record.name);
  const description = getDeliverableDescription(record.key);
  const isPdf = iconKind === "pdf";

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = await fetchDownloadUrl(record.key);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = record.name;
      anchor.rel = "noopener noreferrer";
      anchor.target = "_blank";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = await fetchDownloadUrl(record.key);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="flex flex-col rounded-sm border border-rule/15 bg-ink/40 p-6 backdrop-blur-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-accent/10">
          <FileTypeIcon kind={iconKind} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-light text-paper">
            {displayName}
          </h3>
          <p className="mt-2 font-sans text-sm leading-relaxed text-paper/60">
            {description}
          </p>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.08em] text-paper/40">
            {formatFileSize(record.size)}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={() => void handleDownload()}
          disabled={loading}
          className="border border-accent/30"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Download className="mr-2 h-4 w-4" aria-hidden />
          )}
          Download
        </Button>
        {isPdf ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => void handlePreview()}
            disabled={loading}
            className="border border-paper/20 bg-transparent text-paper hover:bg-paper/5"
          >
            <ExternalLink className="mr-2 h-4 w-4" aria-hidden />
            Preview
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="mt-3 font-sans text-sm text-gold" role="alert">
          {error}
        </p>
      ) : null}
    </article>
  );
}

export function DeliverablesGrid({
  packageName,
  deliveredAt,
  deliverables,
}: DeliverablesGridProps) {
  const deliveredLabel = formatDeliveredDate(deliveredAt);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent-light">
          Deliverables
        </p>
        <h1 className="mt-2 font-display text-3xl font-light text-paper sm:text-4xl">
          Your {packageName} Deliverables
        </h1>
        {deliveredLabel ? (
          <p className="mt-3 font-sans text-sm text-paper/60">
            Delivered {deliveredLabel}
          </p>
        ) : null}
      </header>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        {deliverables.map((record) => (
          <DeliverableCard key={record.key} record={record} />
        ))}
      </div>
    </div>
  );
}
