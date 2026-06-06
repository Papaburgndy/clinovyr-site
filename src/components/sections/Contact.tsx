"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendlyButton } from "@/components/ui/calendly-button";
import { AUTH_LOGIN_URL, SURVEY_INTAKE_URL } from "@/lib/portal-routes";
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

const SURVEY_BENEFITS = [
  "Personalized AI readiness score and tier",
  "Top automation opportunities for your industry",
  "Package recommendation and estimated ROI",
  "Feeds directly into your Clinovyr client portal",
] as const;

export function Contact() {
  return (
    <section
      id="contact"
      className="scroll-mt-24 bg-ink px-6 py-24 md:py-32"
      aria-labelledby="contact-heading"
    >
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-24"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          <motion.div variants={itemVariants}>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-light">
              Discovery Survey
            </p>

            <h2
              id="contact-heading"
              className="mt-6 font-display text-4xl font-light leading-[1.15] tracking-tight text-paper md:text-5xl lg:text-[3.25rem]"
            >
              Ready to see what AI can do for your business?
            </h2>

            <p className="mt-6 max-w-lg font-sans text-base leading-relaxed text-paper/70 md:text-lg">
              Start with our free 8-minute AI discovery survey. Your answers feed
              directly into your Clinovyr portal — powering your readiness score,
              package recommendation, and deliverable pipeline.
            </p>

            <div className="mt-10 space-y-2 font-sans text-sm text-paper/80 md:text-base">
              <p>
                <a
                  href="mailto:clinovyr@gmail.com"
                  className="text-accent-light transition-colors hover:text-paper"
                >
                  clinovyr@gmail.com
                </a>
                <span className="mx-3 text-paper/30" aria-hidden="true">
                  |
                </span>
                <span>Granite Bay, CA</span>
              </p>
            </div>

            <Button
              href={SURVEY_INTAKE_URL}
              className="mt-8"
              aria-label="Start your free AI discovery survey"
            >
              Start your free discovery survey
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>

            <p className="mt-6 font-sans text-sm text-paper/60">
              Prefer to talk first?{" "}
              <CalendlyButton
                label="Book a free discovery call"
                className={cn(
                  "inline-flex h-auto px-0 py-0 align-baseline font-medium text-accent-light",
                  "underline-offset-4 transition-colors duration-300 hover:text-paper hover:underline",
                )}
              />
            </p>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="rounded-sm border border-white/10 bg-white/[0.03] p-6 md:p-8">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-light">
                Free · About 8 minutes
              </p>

              <h3 className="mt-4 font-display text-2xl font-light text-paper md:text-3xl">
                AI Readiness Discovery Survey
              </h3>

              <p className="mt-4 font-sans text-sm leading-relaxed text-paper/70 md:text-base">
                Create a free account, complete onboarding, and take the survey
                in your client portal. Results unlock your personalized roadmap
                and checkout for industry deliverables.
              </p>

              <ul className="mt-6 space-y-3" role="list">
                {SURVEY_BENEFITS.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-start gap-3 font-sans text-sm leading-relaxed text-paper/80"
                  >
                    <CheckCircle
                      className="mt-0.5 h-4 w-4 shrink-0 text-accent-light"
                      aria-hidden="true"
                    />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <Button
                href={SURVEY_INTAKE_URL}
                className="mt-8 w-full"
                aria-label="Create account and start discovery survey"
              >
                Create account &amp; start survey
              </Button>

              <p className="mt-4 text-center font-sans text-xs text-paper/50">
                Already have an account?{" "}
                <Link
                  href={AUTH_LOGIN_URL}
                  className="text-accent-light underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>

            <p className="mt-6 text-center font-sans text-xs text-paper/45">
              General question? Email{" "}
              <a
                href="mailto:clinovyr@gmail.com"
                className="text-paper/60 underline-offset-2 hover:text-accent-light hover:underline"
              >
                clinovyr@gmail.com
              </a>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
