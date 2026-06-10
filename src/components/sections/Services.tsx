"use client";

import { motion } from "framer-motion";
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

const SERVICES = [
  {
    tag: "Start Here",
    name: "Free AI Discovery Survey",
    description:
      "A 10-minute survey that scores your AI readiness, ranks your automation opportunities, and estimates your ROI — instantly, no sales call required.",
    price: "Free",
  },
  {
    tag: "Entry Point",
    name: "AI Opportunity Audit",
    description:
      "Your highest-ROI automation opportunities ranked and explained, with a 30-day implementation checklist and tool recommendations for your stack — plus a setup call.",
    price: "$1,500",
  },
  {
    tag: "Most Popular",
    name: "AI Readiness Assessment",
    description:
      "The complete picture: full readiness report, prioritized roadmap, tool stack guide, and an executive briefing for your leadership — delivered to your portal in minutes.",
    price: "$5,000",
  },
  {
    tag: "Build-Ready",
    name: "Workflow Automation Sprint",
    description:
      "Everything you need to deploy: importable automation blueprints, CRM setup guide, staff training guide, and a live ROI calculator — with hands-on setup sessions included.",
    price: "$12,000",
  },
  {
    tag: "Included",
    name: "Setup & Implementation Help",
    description:
      "Every package includes time with a real person — walkthrough calls, setup sessions, and email support to get your tools and automations actually running.",
    price: "Included",
  },
  {
    tag: "Scalable",
    name: "Industry Playbooks",
    description:
      "Self-serve implementation guides for medical, real estate, legal, construction, wellness, and retail — purchase at buy.clinovyr.com.",
    price: "$497",
  },
] as const;

export function Services() {
  return (
    <section
      id="services"
      className="scroll-mt-24 bg-ink px-6 py-24 md:py-32"
      aria-labelledby="services-heading"
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
            What We Do
          </motion.p>

          <motion.h2
            id="services-heading"
            variants={itemVariants}
            className="mt-6 font-display text-4xl font-light leading-[1.15] tracking-tight text-paper md:text-5xl"
          >
            AI deliverables, built for your business
          </motion.h2>
        </motion.div>

        <motion.div
          className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {SERVICES.map((service) => (
            <motion.article
              key={service.name}
              variants={itemVariants}
              className={cn(
                "group flex flex-col rounded-sm border border-white/10 bg-white/[0.03] p-6 md:p-8",
                "transition-all duration-300 ease-out",
                "hover:-translate-y-1 hover:border-accent-light/30 hover:shadow-[0_8px_32px_rgba(45,158,136,0.15)]",
              )}
            >
              <p className="font-mono text-xs uppercase tracking-[0.15em] text-accent-light">
                {service.tag}
              </p>

              <h3 className="mt-4 font-display text-2xl font-light leading-snug text-paper md:text-[1.65rem]">
                {service.name}
              </h3>

              <p className="mt-4 flex-1 font-sans text-sm leading-relaxed text-paper/75 md:text-base">
                {service.description}
              </p>

              <p className="mt-6 font-mono text-sm text-accent-light">
                {service.price}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
