"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  ACCOUNTING_OPTIONS,
  AI_TOOLS_OPTIONS,
  AssessmentFormData,
  BEST_TIME_OPTIONS,
  CONCERN_OPTIONS,
  CRM_OPTIONS,
  EMAIL_OPTIONS,
  EMPLOYEE_RANGES,
  GOAL_OPTIONS,
  HEAR_ABOUT_OPTIONS,
  INDUSTRIES,
  INITIAL_FORM_DATA,
  PM_OPTIONS,
  REVENUE_RANGES,
  SCHEDULING_OPTIONS,
  STORAGE_KEY,
  TIME_DRAINS,
  TOTAL_STEPS,
} from "@/lib/assessment-types";

type DraftState = {
  step: number;
  formData: AssessmentFormData;
};

function CheckboxGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const toggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-ink">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors",
              selected.includes(option)
                ? "border-accent bg-accent/5 text-ink"
                : "border-rule bg-paper text-ink hover:border-accent/40",
            )}
          >
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => toggle(option)}
              className="h-4 w-4 accent-accent"
            />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
      {children}
      {required ? <span className="text-accent"> *</span> : null}
    </label>
  );
}

function TextInput({
  id,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full rounded-lg border border-rule bg-paper px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
    />
  );
}

function SelectInput({
  id,
  value,
  onChange,
  options,
  placeholder,
  required,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder: string;
  required?: boolean;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full rounded-lg border border-rule bg-paper px-4 py-3 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function RadioGroup({
  label,
  name,
  options,
  value,
  onChange,
}: {
  label: string;
  name: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-ink">{label}</legend>
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors",
              value === option
                ? "border-accent bg-accent/5 text-ink"
                : "border-rule bg-paper text-ink hover:border-accent/40",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              className="h-4 w-4 accent-accent"
            />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function TimeDrainsRanking({
  items,
  onChange,
}: {
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const next = [...items];
    const [removed] = next.splice(draggedIndex, 1);
    next.splice(index, 0, removed);
    setDraggedIndex(index);
    onChange(next);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const moveItem = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [removed] = next.splice(from, 1);
    next.splice(to, 0, removed);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Drag to rank from biggest time drain (top) to smallest (bottom).
      </p>
      <ul className="space-y-2" aria-label="Time drains ranked by priority">
        {items.map((item, index) => (
          <li
            key={item}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              "flex items-center gap-3 rounded-lg border border-rule bg-paper px-4 py-3 text-sm text-ink",
              draggedIndex === index && "border-accent bg-accent/5 opacity-80",
            )}
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-medium text-paper"
              aria-hidden
            >
              {index + 1}
            </span>
            <span className="flex-1 cursor-grab active:cursor-grabbing">{item}</span>
            <div className="flex shrink-0 flex-col gap-0.5">
              <button
                type="button"
                onClick={() => moveItem(index, index - 1)}
                disabled={index === 0}
                aria-label={`Move ${item} up`}
                className="rounded px-1.5 py-0.5 text-muted hover:bg-cream disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveItem(index, index + 1)}
                disabled={index === items.length - 1}
                aria-label={`Move ${item} down`}
                className="rounded px-1.5 py-0.5 text-muted hover:bg-cream disabled:opacity-30"
              >
                ↓
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function validateStep(step: number, data: AssessmentFormData): string | null {
  switch (step) {
    case 1:
      if (!data.companyName.trim()) return "Company name is required.";
      if (!data.industry) return "Please select an industry.";
      if (!data.employees) return "Please select employee count.";
      if (!data.revenue) return "Please select revenue range.";
      if (!data.yearsInBusiness.trim()) return "Years in business is required.";
      return null;
    case 2:
      if (data.crm.length === 0) return "Select at least one CRM option.";
      if (data.emailTools.length === 0) return "Select at least one email option.";
      if (data.scheduling.length === 0) return "Select at least one scheduling option.";
      if (data.pm.length === 0) return "Select at least one project management option.";
      if (data.accounting.length === 0) return "Select at least one accounting option.";
      return null;
    case 3:
      if (data.timeDrainsRanked.length !== TIME_DRAINS.length) {
        return "Please rank all time drains.";
      }
      return null;
    case 4:
      if (!data.aiTools) return "Please indicate your AI tool experience.";
      if (data.comfortLevel === null) return "Please rate your comfort level.";
      if (!data.biggestConcern) return "Please select your biggest concern.";
      return null;
    case 5:
      if (data.goals.length === 0) return "Select at least one goal.";
      if (data.goals.length > 3) return "Select no more than three goals.";
      return null;
    case 6: {
      if (!data.firstName.trim()) return "First name is required.";
      if (!data.lastName.trim()) return "Last name is required.";
      if (!data.email.trim()) return "Email is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        return "Please enter a valid email address.";
      }
      if (!data.phone.trim()) return "Phone number is required.";
      if (!data.bestTimeToConnect) return "Please select a best time to connect.";
      if (!data.hearAbout) return "Please tell us how you heard about Clinovyr.";
      return null;
    }
    default:
      return null;
  }
}

function hasMeaningfulDraft(draft: DraftState): boolean {
  const { formData, step } = draft;
  if (step > 1) return true;

  return (
    formData.companyName.trim() !== "" ||
    formData.industry !== "" ||
    formData.employees !== "" ||
    formData.revenue !== "" ||
    formData.crm.length > 0 ||
    formData.emailTools.length > 0 ||
    formData.goals.length > 0 ||
    formData.firstName.trim() !== "" ||
    formData.email.trim() !== ""
  );
}

function parseDraft(raw: string): DraftState | null {
  const parsed = JSON.parse(raw) as DraftState;
  if (!parsed.formData) return null;

  return {
    step:
      parsed.step && parsed.step >= 1 && parsed.step <= TOTAL_STEPS
        ? parsed.step
        : 1,
    formData: {
      ...INITIAL_FORM_DATA,
      ...parsed.formData,
      timeDrainsRanked:
        parsed.formData.timeDrainsRanked?.length === TIME_DRAINS.length
          ? parsed.formData.timeDrainsRanked
          : [...TIME_DRAINS],
    },
  };
}

export function AIReadinessForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<AssessmentFormData>(INITIAL_FORM_DATA);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<DraftState | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = parseDraft(raw);
        if (parsed && hasMeaningfulDraft(parsed)) {
          setPendingDraft(parsed);
          setShowResumeBanner(true);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || showResumeBanner) return;
    const draft: DraftState = { step, formData };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [step, formData, hydrated, showResumeBanner]);

  const handleResumeDraft = () => {
    if (pendingDraft) {
      setFormData(pendingDraft.formData);
      setStep(pendingDraft.step);
    }
    setShowResumeBanner(false);
    setPendingDraft(null);
  };

  const handleDismissDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setFormData(INITIAL_FORM_DATA);
    setStep(1);
    setShowResumeBanner(false);
    setPendingDraft(null);
  };

  const updateForm = useCallback(
    (patch: Partial<AssessmentFormData>) => {
      setFormData((prev) => ({ ...prev, ...patch }));
      setError(null);
    },
    [],
  );

  const toggleGoal = (goal: string) => {
    const current = formData.goals;
    if (current.includes(goal)) {
      updateForm({ goals: current.filter((g) => g !== goal) });
    } else if (current.length < 3) {
      updateForm({ goals: [...current, goal] });
    }
  };

  const handleNext = () => {
    const validationError = validateStep(step, formData);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const handleBack = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    const validationError = validateStep(6, formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/submit-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Submission failed. Please try again.");
      }

      localStorage.removeItem(STORAGE_KEY);
      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (step / TOTAL_STEPS) * 100;

  const stepTitles = [
    "Business Basics",
    "Current Tech Stack",
    "Biggest Time Drains",
    "AI Experience",
    "Goals",
    "Contact & Booking",
  ];

  if (!hydrated) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-muted">Loading assessment…</p>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="rounded-2xl border border-rule bg-paper p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl text-paper">
          ✓
        </div>
        <h2 className="font-serif text-2xl text-ink">Thank you</h2>
        <p className="mt-3 text-muted">
          Your AI Readiness Assessment has been submitted. We&apos;ll be in touch
          shortly to schedule your consultation.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-rule bg-paper shadow-sm">
      <div className="border-b border-rule px-6 py-5 sm:px-8">
        <div className="mb-3 flex items-center justify-between text-xs text-muted">
          <span>
            Step {step} of {TOTAL_STEPS}
          </span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-cream"
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          aria-label="Assessment progress"
        >
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <h2 className="mt-4 font-serif text-xl text-ink sm:text-2xl">
          {stepTitles[step - 1]}
        </h2>
      </div>

      <div className="space-y-6 px-6 py-8 sm:px-8">
        {showResumeBanner ? (
          <div
            role="status"
            className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-4 sm:flex sm:items-center sm:justify-between sm:gap-4"
          >
            <div>
              <p className="text-sm font-medium text-ink">Resume your assessment</p>
              <p className="mt-1 text-sm text-muted">
                You have a saved draft
                {pendingDraft ? ` from step ${pendingDraft.step}` : ""}. Continue where
                you left off or start fresh.
              </p>
            </div>
            <div className="mt-3 flex shrink-0 gap-2 sm:mt-0">
              <button
                type="button"
                onClick={handleDismissDraft}
                className="rounded-lg border border-rule px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-cream"
              >
                Start over
              </button>
              <button
                type="button"
                onClick={handleResumeDraft}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-accent-light"
              >
                Continue
              </button>
            </div>
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {error}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-5">
            <div>
              <FieldLabel htmlFor="companyName" required>
                Company name
              </FieldLabel>
              <TextInput
                id="companyName"
                value={formData.companyName}
                onChange={(v) => updateForm({ companyName: v })}
                placeholder="Your company name"
                required
              />
            </div>
            <div>
              <FieldLabel htmlFor="industry" required>
                Industry
              </FieldLabel>
              <SelectInput
                id="industry"
                value={formData.industry}
                onChange={(v) => updateForm({ industry: v })}
                options={INDUSTRIES}
                placeholder="Select industry"
                required
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="employees" required>
                  Employees
                </FieldLabel>
                <SelectInput
                  id="employees"
                  value={formData.employees}
                  onChange={(v) => updateForm({ employees: v })}
                  options={EMPLOYEE_RANGES}
                  placeholder="Select range"
                  required
                />
              </div>
              <div>
                <FieldLabel htmlFor="revenue" required>
                  Revenue
                </FieldLabel>
                <SelectInput
                  id="revenue"
                  value={formData.revenue}
                  onChange={(v) => updateForm({ revenue: v })}
                  options={REVENUE_RANGES}
                  placeholder="Select range"
                  required
                />
              </div>
            </div>
            <div>
              <FieldLabel htmlFor="yearsInBusiness" required>
                Years in business
              </FieldLabel>
              <TextInput
                id="yearsInBusiness"
                value={formData.yearsInBusiness}
                onChange={(v) => updateForm({ yearsInBusiness: v })}
                placeholder="e.g. 5"
                required
              />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-8">
            <CheckboxGroup
              label="CRM"
              options={CRM_OPTIONS}
              selected={formData.crm}
              onChange={(crm) => updateForm({ crm })}
            />
            <CheckboxGroup
              label="Email"
              options={EMAIL_OPTIONS}
              selected={formData.emailTools}
              onChange={(emailTools) => updateForm({ emailTools })}
            />
            <CheckboxGroup
              label="Scheduling"
              options={SCHEDULING_OPTIONS}
              selected={formData.scheduling}
              onChange={(scheduling) => updateForm({ scheduling })}
            />
            <CheckboxGroup
              label="Project Management"
              options={PM_OPTIONS}
              selected={formData.pm}
              onChange={(pm) => updateForm({ pm })}
            />
            <CheckboxGroup
              label="Accounting"
              options={ACCOUNTING_OPTIONS}
              selected={formData.accounting}
              onChange={(accounting) => updateForm({ accounting })}
            />
          </div>
        ) : null}

        {step === 3 ? (
          <TimeDrainsRanking
            items={formData.timeDrainsRanked}
            onChange={(timeDrainsRanked) => updateForm({ timeDrainsRanked })}
          />
        ) : null}

        {step === 4 ? (
          <div className="space-y-8">
            <RadioGroup
              label="Have you used AI tools in your business?"
              name="aiTools"
              options={AI_TOOLS_OPTIONS}
              value={formData.aiTools}
              onChange={(aiTools) => updateForm({ aiTools })}
            />
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-ink">
                How comfortable are you with AI? (1 = not at all, 5 = very)
              </legend>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => updateForm({ comfortLevel: level })}
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-lg border text-sm font-medium transition-colors",
                      formData.comfortLevel === level
                        ? "border-accent bg-accent text-paper"
                        : "border-rule bg-paper text-ink hover:border-accent/40",
                    )}
                    aria-pressed={formData.comfortLevel === level}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </fieldset>
            <RadioGroup
              label="What's your biggest concern about AI?"
              name="biggestConcern"
              options={CONCERN_OPTIONS}
              value={formData.biggestConcern}
              onChange={(biggestConcern) => updateForm({ biggestConcern })}
            />
          </div>
        ) : null}

        {step === 5 ? (
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-ink">
              What are your top goals? (Select up to 3)
            </legend>
            <p className="text-xs text-muted">
              {formData.goals.length}/3 selected
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {GOAL_OPTIONS.map((goal) => {
                const selected = formData.goals.includes(goal);
                const disabled = !selected && formData.goals.length >= 3;
                return (
                  <label
                    key={goal}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors",
                      selected
                        ? "border-accent bg-accent/5 text-ink"
                        : disabled
                          ? "cursor-not-allowed border-rule bg-cream/50 text-muted opacity-60"
                          : "cursor-pointer border-rule bg-paper text-ink hover:border-accent/40",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={disabled}
                      onChange={() => toggleGoal(goal)}
                      className="h-4 w-4 accent-accent"
                    />
                    {goal}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        {step === 6 ? (
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="firstName" required>
                  First name
                </FieldLabel>
                <TextInput
                  id="firstName"
                  value={formData.firstName}
                  onChange={(v) => updateForm({ firstName: v })}
                  required
                />
              </div>
              <div>
                <FieldLabel htmlFor="lastName" required>
                  Last name
                </FieldLabel>
                <TextInput
                  id="lastName"
                  value={formData.lastName}
                  onChange={(v) => updateForm({ lastName: v })}
                  required
                />
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="email" required>
                  Email
                </FieldLabel>
                <TextInput
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(v) => updateForm({ email: v })}
                  required
                />
              </div>
              <div>
                <FieldLabel htmlFor="phone" required>
                  Phone
                </FieldLabel>
                <TextInput
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(v) => updateForm({ phone: v })}
                  required
                />
              </div>
            </div>
            <div>
              <FieldLabel htmlFor="bestTimeToConnect" required>
                Best time to connect
              </FieldLabel>
              <SelectInput
                id="bestTimeToConnect"
                value={formData.bestTimeToConnect}
                onChange={(v) => updateForm({ bestTimeToConnect: v })}
                options={BEST_TIME_OPTIONS}
                placeholder="Select a time"
                required
              />
            </div>
            <div>
              <FieldLabel htmlFor="hearAbout" required>
                How did you hear about Clinovyr?
              </FieldLabel>
              <SelectInput
                id="hearAbout"
                value={formData.hearAbout}
                onChange={(v) => updateForm({ hearAbout: v })}
                options={HEAR_ABOUT_OPTIONS}
                placeholder="Select one"
                required
              />
            </div>
            <div>
              <FieldLabel htmlFor="additionalNotes">
                Anything else we should know before our call?
              </FieldLabel>
              <textarea
                id="additionalNotes"
                value={formData.additionalNotes}
                onChange={(e) => updateForm({ additionalNotes: e.target.value })}
                rows={4}
                className="w-full resize-y rounded-lg border border-rule bg-paper px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="Optional — share context, priorities, or questions"
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t border-rule px-6 py-5 sm:px-8">
        {step > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            className="rounded-lg border border-rule px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-cream"
          >
            Back
          </button>
        ) : (
          <span />
        )}

        {step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={handleNext}
            className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-accent-light"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-accent-light disabled:opacity-60"
          >
            {isSubmitting ? "Submitting…" : "Submit Assessment"}
          </button>
        )}
      </div>
    </div>
  );
}
