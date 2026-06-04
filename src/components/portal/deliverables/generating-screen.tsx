"use client";

import { useCallback, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { DeliverablesProgressBar } from "@/components/portal/deliverables-progress-bar";

const POLL_INTERVAL_MS = 30_000;

function fireConfetti() {
  const duration = 2_500;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors: ["#1a6b5a", "#2d9e88", "#c49a3c", "#f5f2ed"],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors: ["#1a6b5a", "#2d9e88", "#c49a3c", "#f5f2ed"],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}

export function GeneratingScreen() {
  const celebratedRef = useRef(false);

  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/order/status", {
        cache: "no-store",
      });

      if (!response.ok) return;

      const data = (await response.json()) as { status?: string };

      if (data.status === "delivered" && !celebratedRef.current) {
        celebratedRef.current = true;
        fireConfetti();
        window.setTimeout(() => {
          window.location.reload();
        }, 1800);
      }
    } catch {
      // ignore transient network errors during polling
    }
  }, []);

  useEffect(() => {
    void checkStatus();
    const intervalId = window.setInterval(() => {
      void checkStatus();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [checkStatus]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center text-center">
      <div
        className="relative flex h-16 w-16 items-center justify-center"
        aria-hidden
      >
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/20" />
        <span className="relative inline-flex h-12 w-12 animate-spin rounded-full border-2 border-accent/30 border-t-accent-light" />
      </div>

      <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.12em] text-accent-light">
        Clinovyr
      </p>
      <h2 className="mt-2 font-display text-2xl font-light text-paper">
        We&apos;re generating your personalized deliverables...
      </h2>
      <p className="mt-3 font-sans text-sm text-paper/60">
        Usually ready within 15–30 minutes. This page updates automatically when
        your files are ready.
      </p>

      <div className="mt-8 w-full">
        <DeliverablesProgressBar />
      </div>
    </div>
  );
}
