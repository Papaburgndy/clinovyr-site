"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendlyButton } from "@/components/ui/calendly-button";
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

const BUSINESS_TYPES = [
  "Medical/Dental",
  "Real Estate",
  "Legal/Financial",
  "Construction",
  "Wellness/Med Spa",
  "Retail/Hospitality",
  "Other",
] as const;

type BusinessType = (typeof BUSINESS_TYPES)[number];

type FormFields = {
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  businessType: BusinessType | "";
  message: string;
};

type FormErrors = Partial<Record<keyof FormFields, string>>;

type SubmissionState = "idle" | "loading" | "success" | "error";

const INITIAL_FIELDS: FormFields = {
  fullName: "",
  businessName: "",
  email: "",
  phone: "",
  businessType: "",
  message: "",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClasses = cn(
  "min-h-11 w-full rounded-sm border border-white/10 bg-white/5 px-4 py-3",
  "font-sans text-base text-paper placeholder:text-paper/50 sm:text-sm",
  "transition-colors duration-200",
  "focus:border-accent-light focus:outline-none focus:ring-2 focus:ring-accent-light/50",
);

function validateFields(fields: FormFields): FormErrors {
  const errors: FormErrors = {};

  if (!fields.fullName.trim()) {
    errors.fullName = "Full name is required.";
  }

  if (!fields.businessName.trim()) {
    errors.businessName = "Business name is required.";
  }

  if (!fields.email.trim()) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(fields.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  return errors;
}

export function Contact() {
  const [fields, setFields] = useState<FormFields>(INITIAL_FIELDS);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submissionState, setSubmissionState] =
    useState<SubmissionState>("idle");
  const [submitError, setSubmitError] = useState("");

  function updateField<K extends keyof FormFields>(
    key: K,
    value: FormFields[K],
  ) {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateFields(fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSubmissionState("idle");
      setSubmitError("");
      return;
    }

    setErrors({});
    setSubmitError("");
    setSubmissionState("loading");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fields.fullName.trim(),
          businessName: fields.businessName.trim(),
          email: fields.email.trim(),
          phone: fields.phone.trim() || undefined,
          businessType: fields.businessType || undefined,
          message: fields.message.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(
          response.status === 404
            ? "Our contact form is being set up. Please email clinovyr@gmail.com directly."
            : "Something went wrong. Please try again or email clinovyr@gmail.com.",
        );
      }

      setSubmissionState("success");
      setFields(INITIAL_FIELDS);
    } catch (error) {
      setSubmissionState("error");
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again or email clinovyr@gmail.com.",
      );
    }
  }

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
              Let&apos;s Talk
            </p>

            <h2
              id="contact-heading"
              className="mt-6 font-display text-4xl font-light leading-[1.15] tracking-tight text-paper md:text-5xl lg:text-[3.25rem]"
            >
              Ready to see what AI can do for your business?
            </h2>

            <p className="mt-6 max-w-lg font-sans text-base leading-relaxed text-paper/70 md:text-lg">
              We offer a free 30-minute discovery call — no pitch, no pressure.
              Just an honest conversation about where AI can make the biggest
              impact for your specific business.
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

            <CalendlyButton
              label="Book your free discovery call"
              className={cn(
                "mt-8 bg-accent text-paper",
                "hover:-translate-y-0.5 hover:bg-accent-light hover:shadow-md",
              )}
            />

            <p className="mt-6 font-mono text-xs text-paper/70">
              Response within 1 business day
            </p>
          </motion.div>

          <motion.div variants={itemVariants}>
            {submissionState === "success" ? (
              <div
                className="flex flex-col items-center justify-center rounded-sm border border-white/10 bg-white/5 px-8 py-16 text-center"
                role="status"
                aria-live="polite"
              >
                <CheckCircle
                  className="h-12 w-12 text-accent-light"
                  aria-hidden="true"
                />
                <p className="mt-6 font-display text-2xl font-light text-paper md:text-3xl">
                  Thank you — we&apos;ll be in touch soon.
                </p>
                <p className="mt-3 max-w-sm font-sans text-sm leading-relaxed text-paper/70">
                  We&apos;ve received your message and will respond within one
                  business day to schedule your free discovery call.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                noValidate
                className="rounded-sm border border-white/10 bg-white/[0.03] p-6 md:p-8"
              >
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <label
                      htmlFor="contact-full-name"
                      className="mb-2 block font-sans text-sm text-paper/90"
                    >
                      Full Name{" "}
                      <span className="text-accent-light" aria-hidden="true">
                        *
                      </span>
                    </label>
                    <input
                      id="contact-full-name"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      required
                      value={fields.fullName}
                      onChange={(e) => updateField("fullName", e.target.value)}
                      className={cn(
                        inputClasses,
                        errors.fullName && "border-red-400/60",
                      )}
                      aria-invalid={errors.fullName ? true : undefined}
                      aria-describedby={
                        errors.fullName ? "contact-full-name-error" : undefined
                      }
                    />
                    {errors.fullName ? (
                      <p
                        id="contact-full-name-error"
                        className="mt-2 font-sans text-xs text-red-400"
                        role="alert"
                      >
                        {errors.fullName}
                      </p>
                    ) : null}
                  </div>

                  <div className="sm:col-span-1">
                    <label
                      htmlFor="contact-business-name"
                      className="mb-2 block font-sans text-sm text-paper/90"
                    >
                      Business Name{" "}
                      <span className="text-accent-light" aria-hidden="true">
                        *
                      </span>
                    </label>
                    <input
                      id="contact-business-name"
                      name="businessName"
                      type="text"
                      autoComplete="organization"
                      required
                      value={fields.businessName}
                      onChange={(e) =>
                        updateField("businessName", e.target.value)
                      }
                      className={cn(
                        inputClasses,
                        errors.businessName && "border-red-400/60",
                      )}
                      aria-invalid={errors.businessName ? true : undefined}
                      aria-describedby={
                        errors.businessName
                          ? "contact-business-name-error"
                          : undefined
                      }
                    />
                    {errors.businessName ? (
                      <p
                        id="contact-business-name-error"
                        className="mt-2 font-sans text-xs text-red-400"
                        role="alert"
                      >
                        {errors.businessName}
                      </p>
                    ) : null}
                  </div>

                  <div className="sm:col-span-1">
                    <label
                      htmlFor="contact-email"
                      className="mb-2 block font-sans text-sm text-paper/90"
                    >
                      Email{" "}
                      <span className="text-accent-light" aria-hidden="true">
                        *
                      </span>
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={fields.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className={cn(
                        inputClasses,
                        errors.email && "border-red-400/60",
                      )}
                      aria-invalid={errors.email ? true : undefined}
                      aria-describedby={
                        errors.email ? "contact-email-error" : undefined
                      }
                    />
                    {errors.email ? (
                      <p
                        id="contact-email-error"
                        className="mt-2 font-sans text-xs text-red-400"
                        role="alert"
                      >
                        {errors.email}
                      </p>
                    ) : null}
                  </div>

                  <div className="sm:col-span-1">
                    <label
                      htmlFor="contact-phone"
                      className="mb-2 block font-sans text-sm text-paper/90"
                    >
                      Phone{" "}
                      <span className="font-mono text-xs text-paper/40">
                        (optional)
                      </span>
                    </label>
                    <input
                      id="contact-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      value={fields.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      className={inputClasses}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="contact-business-type"
                      className="mb-2 block font-sans text-sm text-paper/90"
                    >
                      Business Type
                    </label>
                    <select
                      id="contact-business-type"
                      name="businessType"
                      value={fields.businessType}
                      onChange={(e) =>
                        updateField(
                          "businessType",
                          e.target.value as BusinessType | "",
                        )
                      }
                      className={cn(inputClasses, "cursor-pointer")}
                    >
                      <option value="" className="bg-ink text-paper">
                        Select your industry
                      </option>
                      {BUSINESS_TYPES.map((type) => (
                        <option
                          key={type}
                          value={type}
                          className="bg-ink text-paper"
                        >
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="contact-message"
                      className="mb-2 block font-sans text-sm text-paper/90"
                    >
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows={4}
                      placeholder="What's your biggest operational challenge?"
                      value={fields.message}
                      onChange={(e) => updateField("message", e.target.value)}
                      className={cn(inputClasses, "resize-y min-h-[120px]")}
                    />
                  </div>
                </div>

                {submissionState === "error" && submitError ? (
                  <p
                    className="mt-5 font-sans text-sm text-red-400"
                    role="alert"
                    aria-live="polite"
                  >
                    {submitError}
                  </p>
                ) : null}

                <Button
                  type="submit"
                  disabled={submissionState === "loading"}
                  className="mt-6 w-full disabled:pointer-events-none disabled:opacity-70"
                  aria-busy={submissionState === "loading"}
                >
                  {submissionState === "loading" ? (
                    <>
                      <Loader2
                        className="mr-2 h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                      Sending…
                    </>
                  ) : (
                    "Send Message →"
                  )}
                </Button>
              </form>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
