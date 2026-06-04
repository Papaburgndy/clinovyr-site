"use client";

import { motion } from "framer-motion";
import {
  HardHat,
  Home,
  Scale,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
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

const VERTICALS: {
  name: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    name: "Medical & Dental",
    description:
      "HIPAA-aware intake workflows, appointment reminders, and follow-up automation — with guidance on compliant AI tool use.",
    icon: Stethoscope,
  },
  {
    name: "Real Estate & Property",
    description:
      "Lead qualification, listing content, CRM automation, and nurture sequences for Placer County agents and brokers.",
    icon: Home,
  },
  {
    name: "Legal & Financial",
    description:
      "Client intake, document drafting assistance, and research workflows with ethics-aware prompts and attorney review checkpoints.",
    icon: Scale,
  },
  {
    name: "Construction & Contracting",
    description:
      "Lead scoring, bid support, project updates, and subcontractor coordination for GCs and specialty trades.",
    icon: HardHat,
  },
  {
    name: "Wellness & Med Spa",
    description:
      "Booking automation, post-treatment follow-up, rebooking sequences, and social content — with FTC-aware promotional review.",
    icon: Sparkles,
  },
  {
    name: "Retail & Hospitality",
    description:
      "Win-back campaigns, review management, personalized email, and social content for local shops and restaurants.",
    icon: ShoppingBag,
  },
];

export function Verticals() {
  return (
    <section
      id="verticals"
      className="scroll-mt-24 bg-cream px-6 py-24 md:py-32"
      aria-labelledby="verticals-heading"
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
            className="font-mono text-xs uppercase tracking-[0.2em] text-muted"
          >
            Who We Serve
          </motion.p>

          <motion.h2
            id="verticals-heading"
            variants={itemVariants}
            className="mt-6 font-display text-4xl font-light leading-[1.15] tracking-tight text-ink md:text-5xl"
          >
            Built for Placer County&apos;s leading industries
          </motion.h2>

          <motion.p
            variants={itemVariants}
            className="mt-6 font-sans text-base leading-relaxed text-muted md:text-lg"
          >
            We specialize in six verticals where AI delivers measurable ROI fast.
          </motion.p>
        </motion.div>

        <motion.div
          className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {VERTICALS.map((vertical) => {
            const Icon = vertical.icon;

            return (
              <motion.article
                key={vertical.name}
                variants={itemVariants}
                className={cn(
                  "group flex flex-col rounded-sm border border-rule bg-paper p-6 md:p-8",
                  "transition-all duration-300 ease-out",
                  "hover:-translate-y-1 hover:border-accent/20 hover:shadow-[0_8px_32px_rgba(26,107,90,0.08)]",
                )}
              >
                <Icon
                  className="h-6 w-6 text-accent"
                  aria-hidden="true"
                />

                <h3 className="mt-4 font-sans text-lg font-semibold leading-snug text-ink">
                  {vertical.name}
                </h3>

                <p className="mt-3 flex-1 font-sans text-sm leading-relaxed text-ink/80 md:text-base">
                  {vertical.description}
                </p>

                <a
                  href="#contact"
                  className={cn(
                    "mt-6 inline-flex items-center font-sans text-sm font-medium text-accent",
                    "transition-colors duration-300 hover:text-accent-light",
                  )}
                >
                  Learn more →
                </a>
              </motion.article>
            );
          })}
        </motion.div>

        <motion.div
          className="mt-16 text-center"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          <motion.p
            variants={itemVariants}
            className="font-sans text-base leading-relaxed text-ink/85 md:text-lg"
          >
            Don&apos;t see your industry? We work across all Placer County business
            sectors.{" "}
            <a
              href="#contact"
              className={cn(
                "font-medium text-accent underline-offset-4",
                "transition-colors duration-300 hover:text-accent-light hover:underline",
              )}
            >
              Talk to us
            </a>
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
