"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const VIEWPORT = { once: true, margin: "-100px" } as const;

const STAGGER_DELAY = 0.12;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: STAGGER_DELAY,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const STAT_CARDS = [
  {
    value: "88%",
    description:
      "of organizations are now using AI in at least one function (McKinsey 2026)",
  },
  {
    value: "Minutes",
    description:
      "from checkout to industry-specific reports, blueprints, and calculators in your portal",
  },
  {
    value: "Placer + Sac",
    description: "Placer and Sacramento Counties — our market, our neighbors, our focus",
  },
] as const;

export function Problem() {
  return (
    <section
      id="about"
      className="scroll-mt-24 bg-paper px-6 py-24 md:py-32"
      aria-labelledby="problem-heading"
    >
      <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-2 lg:gap-20 lg:items-center">
        <motion.div
          className="flex flex-col"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          <motion.p
            variants={itemVariants}
            className="font-mono text-xs uppercase tracking-[0.2em] text-muted"
          >
            The Gap
          </motion.p>

          <motion.h2
            id="problem-heading"
            variants={itemVariants}
            className="mt-6 font-display text-4xl font-light leading-[1.15] tracking-tight text-ink md:text-5xl"
          >
            Most businesses know they need AI. Almost none know where to actually
            start.
          </motion.h2>

          <motion.div
            variants={itemVariants}
            className="mt-8 space-y-5 font-sans text-base leading-relaxed text-ink/85 md:text-lg"
          >
            <p>
              Every week brings another headline about AI transforming industries.
              Local business owners in Roseville and Granite Bay feel the pressure
              — but the path forward is anything but clear.
            </p>
            <p>
              Big consulting firms charge six figures and speak in jargon. Online
              freelancers offer cheap automation but lack the business context to
              know what actually moves the needle. The result is paralysis while
              competitors quietly pull ahead.
            </p>
            <p className="font-medium text-ink">
              Clinovyr is the missing piece — a local, trusted partner who speaks
              business first, technology second.
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          className="flex flex-col gap-5"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {STAT_CARDS.map((stat) => (
            <motion.article
              key={stat.value}
              variants={itemVariants}
              className={cn(
                "border-l-4 border-accent bg-cream px-6 py-6 md:px-8 md:py-7",
              )}
            >
              <p className="font-display text-3xl font-light text-gold md:text-4xl">
                {stat.value}
              </p>
              <p className="mt-2 font-sans text-sm leading-relaxed text-muted md:text-base">
                {stat.description}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
