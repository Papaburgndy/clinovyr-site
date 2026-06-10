"use client";

import { Fragment } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SURVEY_INTAKE_URL } from "@/lib/portal-routes";
import { cn } from "@/lib/utils";

const VIEWPORT = { once: true, margin: "-100px" } as const;

const STAGGER_DELAY = 0.1;

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

const STEPS = [
  {
    number: "01",
    title: "Take the free survey.",
    description:
      "Ten minutes about your operations, tools, and biggest time drains. You get an instant AI readiness score, your top automation opportunities, and an ROI estimate.",
  },
  {
    number: "02",
    title: "Get your deliverables in minutes.",
    description:
      "Choose a package and your industry-specific reports, blueprints, calculators, and guides are generated for your business and waiting in your portal minutes after checkout.",
  },
  {
    number: "03",
    title: "We help you set it up.",
    description:
      "Every package includes setup sessions with a real person plus email support — so the automations and tools in your deliverables actually get up and running.",
  },
] as const;

export function Process() {
  return (
    <section
      id="process"
      className="scroll-mt-24 bg-ink px-6 py-24 md:py-32"
      aria-labelledby="process-heading"
    >
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="max-w-2xl"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          <motion.p
            variants={itemVariants}
            className="font-mono text-xs uppercase tracking-[0.2em] text-paper/70"
          >
            How It Works
          </motion.p>

          <motion.h2
            id="process-heading"
            variants={itemVariants}
            className="mt-6 font-display text-4xl font-light leading-[1.15] tracking-tight text-paper md:text-5xl"
          >
            From a 10-minute survey to working automations
          </motion.h2>
        </motion.div>

        <motion.div
          className="mt-16 flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {STEPS.map((step, index) => (
            <Fragment key={step.number}>
              <motion.article
                variants={itemVariants}
                className="flex-1"
              >
                <p
                  className="font-display text-7xl font-light leading-none text-gold/20 md:text-8xl"
                  aria-hidden="true"
                >
                  {step.number}
                </p>

                <h3 className="mt-4 font-sans text-lg font-bold leading-snug text-paper md:text-xl">
                  {step.title}
                </h3>

                <p className="mt-3 font-sans text-sm leading-relaxed text-paper/75 md:text-base">
                  {step.description}
                </p>
              </motion.article>

              {index < STEPS.length - 1 ? (
                <div
                  className="hidden shrink-0 self-center lg:flex lg:px-1"
                  aria-hidden="true"
                >
                  <ArrowRight className="h-5 w-5 text-muted/30" />
                </div>
              ) : null}
            </Fragment>
          ))}
        </motion.div>

        <motion.div
          className="mt-16 border-t border-white/10 pt-12 text-center"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          <motion.p
            variants={itemVariants}
            className="font-sans text-base leading-relaxed text-paper/75 md:text-lg"
          >
            <Button
              href={SURVEY_INTAKE_URL}
              className={cn(
                "h-auto max-w-full flex-wrap px-0 py-0 text-center font-medium text-accent",
                "bg-transparent underline-offset-4 transition-colors duration-300 hover:bg-transparent hover:text-accent-light hover:underline",
              )}
              aria-label="Start your free AI discovery survey"
            >
              Ready to start? → Take your free AI discovery survey
            </Button>
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
