"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

export function SurveyResponsesPanel({ responses }: { responses: unknown }) {
  const [open, setOpen] = useState(false);
  const json = JSON.stringify(responses, null, 2);

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted hover:text-paper"
      >
        <span>Survey responses (JSON)</span>
        {open ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
      {open ? (
        <pre className="max-h-96 overflow-auto border-t border-white/10 px-4 py-3 font-mono text-[11px] leading-relaxed text-paper/80">
          {json}
        </pre>
      ) : null}
    </div>
  );
}
