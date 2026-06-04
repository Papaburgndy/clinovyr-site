"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ActionResult = { ok?: boolean; error?: string };

async function postAdmin(path: string, body: Record<string, string>) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as ActionResult;
  if (!res.ok) {
    throw new Error(data.error ?? "Request failed");
  }
  return data;
}

export function AdminActionButton({
  label,
  path,
  body,
  variant = "default",
  confirmMessage,
  onSuccess,
}: {
  label: string;
  path: string;
  body: Record<string, string>;
  variant?: "default" | "danger";
  confirmMessage?: string;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setLoading(true);
    setError(null);
    try {
      await postAdmin(path, body);
      onSuccess?.();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={loading}
        className={
          variant === "danger"
            ? "rounded border border-red-500/40 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-red-400 hover:bg-red-500/10 disabled:opacity-50"
            : "rounded border border-white/15 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-paper/80 hover:bg-white/5 disabled:opacity-50"
        }
      >
        {loading ? "…" : label}
      </button>
      {error ? (
        <span className="text-[10px] text-red-400">{error}</span>
      ) : null}
    </span>
  );
}
