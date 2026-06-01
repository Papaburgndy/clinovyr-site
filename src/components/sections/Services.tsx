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
    tag: "Entry Point",
    name: "AI Readiness Assessment",
    description:
      "A structured 2–3 week audit of your operations, data, and workflows. You get a prioritized AI roadmap with ROI estimates and a clear action plan.",
    price: "$3,500–$7,500",
  },
  {
    tag: "Core Service",
    name: "Workflow Automation",
    description:
      "Hands-on implementation of AI automations: lead intake, follow-up sequences, scheduling, invoicing, and reporting. Results in 30–60 days.",
    price: "$8,000–$25,000",
  },
  {
    tag: "Recurring",
    name: "AI Operations Retainer",
    description:
      "Your fractional Chief AI Officer. Monthly optimization, new automations, staff training, and strategic guidance.",
    price: "$2,000–$5,000/mo",
  },
  {
    tag: "Visibility",
    name: "Lunch & Learn Workshops",
    description:
      "Practical, hands-on AI sessions for your team or organization. Drives adoption and generates referrals.",
    price: "$1,500–$4,000",
  },
  {
    tag: "High Ticket",
    name: "AI Strategy & Roadmap",
    description:
      "Board-ready AI strategy for growing SMBs. Full operational audit, vendor evaluation, and phased implementation plan.",
    price: "$12,000–$30,000",
  },
  {
    tag: "Scalable",
    name: "Industry Playbooks",
    description:
      "Packaged AI implementation guides built for specific verticals: medical, real estate, legal, construction.",
    price: "$500–$2,500",
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
            Six ways Clinovyr drives results
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
