"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
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

const TIERS = [
  {
    name: "AI Opportunity Audit",
    price: "$1,500",
    priceNote: "one-time · delivered in minutes",
    featured: false,
    features: [
      "Opportunity Brief — your top automations ranked by ROI",
      "30-day Implementation Checklist",
      "Tool Recommendations guide for your stack",
      "Setup call to walk through your results",
      "Email support while you implement",
    ],
  },
  {
    name: "AI Readiness Assessment",
    price: "$5,000",
    priceNote: "one-time · delivered in minutes",
    featured: true,
    features: [
      "Full AI Readiness Report scored across 5 categories",
      "Prioritized Opportunity Roadmap with phased timeline",
      "Tool Stack Guide & Implementation Checklist",
      "Executive Briefing deck for your leadership team",
      "Setup sessions + 30-day email support",
    ],
  },
  {
    name: "Workflow Automation Sprint",
    price: "$12,000",
    priceNote: "one-time · delivered in minutes",
    featured: false,
    features: [
      "Everything in the Assessment report suite",
      "Importable automation blueprints for your industry",
      "CRM Setup Guide & Staff Training Guide",
      "ROI Calculator with live, editable formulas",
      "Hands-on setup sessions to get automations running",
    ],
  },
] as const;

export function Pricing() {
  return (
    <section
      id="pricing"
      className="scroll-mt-24 bg-paper px-6 py-24 md:py-32"
      aria-labelledby="pricing-heading"
    >
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          <motion.p
            variants={itemVariants}
            className="font-mono text-xs uppercase tracking-[0.2em] text-muted"
          >
            Engagement Options
          </motion.p>

          <motion.h2
            id="pricing-heading"
            variants={itemVariants}
            className="mt-6 font-display text-4xl font-light leading-[1.15] tracking-tight text-ink md:text-5xl"
          >
            Three ways to work with Clinovyr
          </motion.h2>

          <motion.p
            variants={itemVariants}
            className="mt-4 font-sans text-base leading-relaxed text-muted md:text-lg"
          >
            Industry-specific reports, blueprints, and calculators — generated
            for your business and delivered to your portal within minutes of
            purchase, with real humans to help you set everything up.
          </motion.p>
        </motion.div>

        <motion.div
          className="mt-16 grid grid-cols-1 items-center gap-6 md:grid-cols-3 lg:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {TIERS.map((tier) => (
            <motion.article
              key={tier.name}
              variants={itemVariants}
              className={cn(
                "relative flex flex-col rounded-sm border p-6 md:p-8",
                tier.featured
                  ? "border-accent bg-cream md:scale-105 md:shadow-lg"
                  : "border-rule bg-paper",
              )}
            >
              {tier.featured ? (
                <p className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-sm bg-accent px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-paper">
                  Most Popular
                </p>
              ) : null}

              <p className="font-mono text-xs uppercase tracking-[0.15em] text-accent">
                {tier.name}
              </p>

              <div className="mt-4">
                <p className="font-display text-4xl font-light leading-none text-ink md:text-5xl">
                  {tier.price}
                </p>
                <p className="mt-2 font-mono text-sm text-muted">
                  {tier.priceNote}
                </p>
              </div>

              <ul className="mt-8 flex flex-1 flex-col gap-3" role="list">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 font-sans text-sm leading-relaxed text-ink/80 md:text-base"
                  >
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                      aria-hidden="true"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                href={SURVEY_INTAKE_URL}
                className="mt-8 w-full"
                aria-label={`Get started with ${tier.name}`}
              >
                Get Started
              </Button>
            </motion.article>
          ))}
        </motion.div>

        <motion.p
          className="mt-12 text-center font-sans text-sm leading-relaxed text-muted md:text-base"
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          Not sure which fits? Take the free discovery survey — your results
          include a recommendation, and you can book a call before buying
          anything.
        </motion.p>
      </div>
    </section>
  );
}
