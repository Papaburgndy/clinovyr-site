"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { CalendlyButton } from "@/components/ui/calendly-button";
import { cn } from "@/lib/utils";

const STAGGER_DELAY = 0.15;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: STAGGER_DELAY,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-ink px-6 pb-20 pt-16"
      aria-labelledby="hero-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className={cn(
            "hero-orb-teal absolute -left-[10%] top-[15%] h-[min(70vw,520px)] w-[min(70vw,520px)] rounded-full",
            "bg-[radial-gradient(circle,rgba(45,158,136,0.35)_0%,transparent_70%)] opacity-[0.12]",
          )}
        />
        <div
          className={cn(
            "hero-orb-gold absolute -right-[5%] bottom-[10%] h-[min(55vw,420px)] w-[min(55vw,420px)] rounded-full",
            "bg-[radial-gradient(circle,rgba(196,154,60,0.4)_0%,transparent_70%)] opacity-[0.1]",
          )}
        />
      </div>

      <motion.div
        className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-start text-left"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          variants={itemVariants}
          className="mb-8 flex items-center gap-4"
        >
          <span
            className="h-px w-10 shrink-0 bg-rule/40"
            aria-hidden="true"
          />
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-paper/70">
            AI Consulting — Granite Bay, CA
          </p>
        </motion.div>

        <motion.h1
          id="hero-heading"
          variants={itemVariants}
          className="font-display text-4xl font-light leading-[1.05] tracking-tight text-paper sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl"
        >
          Your business,
          <br />
          <span className="italic text-gold">intelligently</span>
          <br />
          amplified.
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="mt-8 max-w-prose font-sans text-base leading-relaxed text-paper/75 md:text-lg"
        >
          Clinovyr helps Roseville and Granite Bay businesses implement AI —
          cutting busywork, accelerating growth, and building a measurable edge
          over competitors who are still doing things the old way.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
        >
          <CalendlyButton
            label="Book a Free Consultation"
            className={cn(
              "gap-2 bg-accent text-paper",
              "hover:-translate-y-0.5 hover:bg-accent-light hover:shadow-md",
            )}
          />
          <a
            href="#services"
            className={cn(
              "inline-flex items-center justify-center rounded-sm border border-paper/30 px-6 py-3",
              "font-sans text-sm font-medium text-paper",
              "transition-all duration-300 hover:border-paper/50 hover:bg-white/5",
            )}
          >
            See Our Services
          </a>
        </motion.div>

        <motion.p
          variants={itemVariants}
          className="mt-8 font-mono text-xs leading-relaxed text-paper/70"
        >
          Serving medical practices, law firms, real estate, construction & more
          across Placer County
        </motion.p>
      </motion.div>

      <a
        href="#services"
        className="hero-scroll-indicator absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-paper/50 transition-colors hover:text-paper/80"
        aria-label="Scroll to services"
      >
        <ChevronDown className="h-6 w-6" aria-hidden="true" />
      </a>
    </section>
  );
}
