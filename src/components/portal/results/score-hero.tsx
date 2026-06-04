"use client";

import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  useMotionValueEvent,
} from "framer-motion";
import { useEffect, useState } from "react";
import { getScoreGaugeColor, TIER_INFO } from "@/lib/opportunities";
import type { ReadinessTier } from "@/lib/scoring";
import { cn } from "@/lib/utils";

type ScoreHeroProps = {
  score: number;
  tier: string;
};

const SIZE = 220;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function resolveTier(tier: string): ReadinessTier {
  if (tier in TIER_INFO) {
    return tier as ReadinessTier;
  }
  return "Developing";
}

export function ScoreHero({ score, tier }: ScoreHeroProps) {
  const progress = useMotionValue(0);
  const displayScore = useTransform(progress, (value) => Math.round(value));
  const [scoreLabel, setScoreLabel] = useState(0);
  const strokeOffset = useTransform(
    progress,
    (value) => CIRCUMFERENCE - (value / 100) * CIRCUMFERENCE,
  );

  const tierKey = resolveTier(tier);
  const tierInfo = TIER_INFO[tierKey];
  const gaugeColor = getScoreGaugeColor(score);

  useMotionValueEvent(displayScore, "change", setScoreLabel);

  useEffect(() => {
    const controls = animate(progress, score, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
    });
    return controls.stop;
  }, [progress, score]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-sm border border-rule/15 bg-ink/60 p-8 backdrop-blur-sm sm:p-10"
    >
      <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:gap-12">
        <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="-rotate-90"
            aria-hidden
          >
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth={STROKE}
              className="text-rule/20"
            />
            <motion.circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={gaugeColor}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              style={{ strokeDashoffset: strokeOffset }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-5xl text-paper">{scoreLabel}</span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-paper/45">
              / 100
            </span>
          </div>
        </div>

        <div className="text-center lg:text-left">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent-light">
            Readiness tier
          </p>
          <h2
            className={cn(
              "mt-2 font-display text-3xl font-light sm:text-4xl",
              score <= 40 && "text-amber-500",
              score > 40 && score <= 70 && "text-accent-light",
              score > 70 && "text-gold",
            )}
          >
            {tierInfo.label}
          </h2>
          <p className="mt-3 max-w-md font-sans text-sm leading-relaxed text-paper/65">
            {tierInfo.description}
          </p>
        </div>
      </div>
    </motion.section>
  );
}
