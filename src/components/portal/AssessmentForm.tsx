"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { Check } from "lucide-react";
import { validateAssessmentStep } from "@/lib/validate-assessment";
import { cn } from "@/lib/utils";
import {
  ACCOUNTING_OPTIONS,
  AI_OWNER_OPTIONS,
  AI_TOOLS_OPTIONS,
  CONCERN_OPTIONS,
  CRM_OPTIONS,
  EMAIL_OPTIONS,
  EMPLOYEE_RANGES,
  GOAL_OPTIONS,
  MARKETING_CHANNEL_OPTIONS,
  PM_OPTIONS,
  REVENUE_RANGES,
  SCHEDULING_OPTIONS,
  STEP_LABELS,
  STORAGE_KEY,
  TIME_DRAINS,
  TOTAL_STEPS,
  getIndustryQuestions,
  type AssessmentFormData,
  type CompanyProfileForAssessment,
  type IndustryMetrics,
} from "@/types/assessment";

type FormState = {
  step: number;
  formData: AssessmentFormData;
  completedSteps: number[];
};

type FormAction =
  | { type: "INIT"; payload: FormState }
  | { type: "SET_STEP"; step: number }
  | { type: "UPDATE_FORM"; patch: Partial<AssessmentFormData> }
  | { type: "MARK_STEP_COMPLETE"; step: number };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "INIT":
      return action.payload;
    case "SET_STEP":
      return { ...state, step: action.step };
    case "UPDATE_FORM":
      return {
        ...state,
        formData: { ...state.formData, ...action.patch },
      };
    case "MARK_STEP_COMPLETE":
      return {
        ...state,
        completedSteps: state.completedSteps.includes(action.step)
          ? state.completedSteps
          : [...state.completedSteps, action.step].sort((a, b) => a - b),
      };
    default:
      return state;
  }
}

type AssessmentFormProps = {
  initialData: AssessmentFormData;
  initialStep: number;
  initialCompletedSteps: number[];
  companyProfile: CompanyProfileForAssessment;
  hasSavedProgress: boolean;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

type ScoreReveal = {
  score: number;
  tier: string;
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
      <legend className="text-sm font-medium text-paper/90">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-sm border px-4 py-3 text-sm transition-colors",
              selected.includes(option)
                ? "border-accent bg-accent/10 text-paper"
                : "border-rule/20 bg-ink/40 text-paper/80 hover:border-accent/40",
            )}
          >
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => toggle(option)}
              className="h-4 w-4 accent-accent-light"
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
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-medium text-paper/90"
    >
      {children}
      {required ? <span className="text-accent-light"> *</span> : null}
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
  disabled,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className="w-full rounded-sm border border-rule/25 bg-ink px-4 py-3 font-sans text-sm text-paper placeholder:text-paper/35 focus:border-accent-light/50 focus:outline-none focus:ring-2 focus:ring-accent-light/40 disabled:cursor-not-allowed disabled:opacity-60"
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
      className="w-full rounded-sm border border-rule/25 bg-ink px-4 py-3 font-sans text-sm text-paper focus:border-accent-light/50 focus:outline-none focus:ring-2 focus:ring-accent-light/40"
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
      <legend className="text-sm font-medium text-paper/90">{label}</legend>
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-sm border px-4 py-3 text-sm transition-colors",
              value === option
                ? "border-accent bg-accent/10 text-paper"
                : "border-rule/20 bg-ink/40 text-paper/80 hover:border-accent/40",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              className="h-4 w-4 accent-accent-light"
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

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const next = [...items];
    const [removed] = next.splice(draggedIndex, 1);
    next.splice(index, 0, removed);
    setDraggedIndex(index);
    onChange(next);
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
      <p className="text-sm text-paper/55">
        Drag to rank from biggest time drain (top) to smallest (bottom).
      </p>
      <ul className="space-y-2" aria-label="Time drains ranked by priority">
        {items.map((item, index) => (
          <li
            key={item}
            draggable
            onDragStart={() => setDraggedIndex(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={() => setDraggedIndex(null)}
            className={cn(
              "flex items-center gap-3 rounded-sm border border-rule/20 bg-ink/40 px-4 py-3 text-sm text-paper/85",
              draggedIndex === index && "border-accent bg-accent/10 opacity-80",
            )}
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent font-mono text-xs text-paper"
              aria-hidden
            >
              {index + 1}
            </span>
            <span className="flex-1 cursor-grab active:cursor-grabbing">
              {item}
            </span>
            <div className="flex shrink-0 flex-col gap-0.5">
              <button
                type="button"
                onClick={() => moveItem(index, index - 1)}
                disabled={index === 0}
                aria-label={`Move ${item} up`}
                className="rounded px-1.5 py-0.5 text-paper/45 hover:bg-ink/60 disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveItem(index, index + 1)}
                disabled={index === items.length - 1}
                aria-label={`Move ${item} down`}
                className="rounded px-1.5 py-0.5 text-paper/45 hover:bg-ink/60 disabled:opacity-30"
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

function ScoreRevealAnimation({
  score,
  tier,
}: {
  score: number;
  tier: string;
}) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplayScore(Math.round(score * eased));
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    const frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div className="flex flex-col items-center py-16 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent-light">
        Assessment complete
      </p>
      <p className="mt-6 font-display text-7xl font-light text-paper">
        {displayScore}
        <span className="text-3xl text-paper/40">/100</span>
      </p>
      <p className="mt-4 font-display text-2xl text-accent-light">{tier}</p>
      <p className="mt-3 font-sans text-sm text-paper/50">
        Redirecting to your results…
      </p>
    </div>
  );
}

export function AssessmentForm({
  initialData,
  initialStep,
  initialCompletedSteps,
  companyProfile,
  hasSavedProgress,
}: AssessmentFormProps) {
  const router = useRouter();
  const [state, dispatch] = useReducer(formReducer, {
    step: initialStep,
    formData: {
      ...initialData,
      // Future-proof saved drafts: if the master TIME_DRAINS list gains items
      // after a draft was saved, append the missing ones so ranking validation
      // still passes.
      timeDrainsRanked: [
        ...initialData.timeDrainsRanked,
        ...TIME_DRAINS.filter(
          (d) => !initialData.timeDrainsRanked.includes(d),
        ),
      ],
    },
    completedSteps: initialCompletedSteps,
  });
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [showResumeBanner, setShowResumeBanner] = useState(hasSavedProgress);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scoreReveal, setScoreReveal] = useState<ScoreReveal | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSaveRef = useRef(false);

  const { step, formData, completedSteps } = state;

  useEffect(() => {
    setHydrated(true);
  }, []);

  const persistDraft = useCallback(
    async (payload: FormState) => {
      setSaveStatus("saving");
      try {
        const res = await fetch("/api/survey/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step: payload.step,
            formData: payload.formData,
            completedSteps: payload.completedSteps,
          }),
        });

        if (!res.ok) {
          setSaveStatus("error");
          return;
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    },
    [],
  );

  useEffect(() => {
    if (!hydrated || showResumeBanner || scoreReveal) return;

    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      void persistDraft(state);
    }, 500);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [hydrated, showResumeBanner, scoreReveal, state, persistDraft]);

  const updateForm = useCallback((patch: Partial<AssessmentFormData>) => {
    dispatch({ type: "UPDATE_FORM", patch });
    setError(null);
  }, []);

  const toggleGoal = (goal: string) => {
    const current = formData.goals;
    if (current.includes(goal)) {
      updateForm({ goals: current.filter((g) => g !== goal) });
    } else if (current.length < 3) {
      updateForm({ goals: [...current, goal] });
    }
  };

  const handleNext = () => {
    const validationError = validateAssessmentStep(step, formData);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    dispatch({ type: "MARK_STEP_COMPLETE", step });
    dispatch({ type: "SET_STEP", step: Math.min(step + 1, TOTAL_STEPS) });
  };

  const handleBack = () => {
    setError(null);
    dispatch({ type: "SET_STEP", step: Math.max(step - 1, 1) });
  };

  const handleSaveAndExit = async () => {
    skipNextSaveRef.current = true;
    await persistDraft(state);
    router.push("/dashboard");
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/survey/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = (await res.json()) as {
        error?: string;
        score?: number;
        tier?: string;
      };

      if (!res.ok) {
        throw new Error(data.error ?? "Submission failed. Please try again.");
      }

      localStorage.removeItem(STORAGE_KEY);
      skipNextSaveRef.current = true;
      setScoreReveal({
        score: data.score ?? 0,
        tier: data.tier ?? "",
      });

      setTimeout(() => {
        router.push("/dashboard/results");
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Submission failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (step / TOTAL_STEPS) * 100;

  if (!hydrated) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-paper/50">Loading assessment…</p>
      </div>
    );
  }

  if (scoreReveal) {
    return (
      <ScoreRevealAnimation score={scoreReveal.score} tier={scoreReveal.tier} />
    );
  }

  return (
    <div className="rounded-sm border border-rule/15 bg-ink/60 backdrop-blur-sm">
      <div className="border-b border-rule/15 px-6 py-5 sm:px-8">
        <nav
          aria-label="Assessment progress"
          className="mb-4 overflow-x-auto"
        >
          <ol className="flex min-w-[640px] items-center justify-between gap-1">
            {STEP_LABELS.map((label, index) => {
              const stepNumber = index + 1;
              const isComplete = completedSteps.includes(stepNumber);
              const isCurrent = step === stepNumber;

              return (
                <li key={label} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center gap-1 text-center">
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full border font-mono text-[11px]",
                        isComplete
                          ? "border-accent bg-accent text-paper"
                          : isCurrent
                            ? "border-accent-light text-accent-light"
                            : "border-rule/30 text-paper/35",
                      )}
                      aria-current={isCurrent ? "step" : undefined}
                    >
                      {isComplete ? (
                        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                      ) : (
                        stepNumber
                      )}
                    </span>
                    <span
                      className={cn(
                        "font-mono text-[9px] uppercase tracking-[0.06em] sm:text-[10px]",
                        isComplete || isCurrent
                          ? "text-accent-light"
                          : "text-paper/40",
                      )}
                    >
                      {label}
                    </span>
                  </div>
                  {index < STEP_LABELS.length - 1 ? (
                    <div
                      className={cn(
                        "mx-1 h-px flex-1",
                        isComplete ? "bg-accent/50" : "bg-rule/20",
                      )}
                      aria-hidden
                    />
                  ) : null}
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="mb-3 flex items-center justify-between text-xs text-paper/45">
          <span>
            Step {step} of {TOTAL_STEPS}
          </span>
          <span className="flex items-center gap-3">
            {saveStatus === "saving" ? (
              <span className="font-mono text-[10px] uppercase tracking-wider text-paper/40">
                Saving…
              </span>
            ) : null}
            {saveStatus === "saved" ? (
              <span className="font-mono text-[10px] uppercase tracking-wider text-accent-light">
                Saved
              </span>
            ) : null}
            {saveStatus === "error" ? (
              <span className="font-mono text-[10px] uppercase tracking-wider text-red-400">
                Save failed
              </span>
            ) : null}
            <span>{Math.round(progress)}% complete</span>
          </span>
        </div>

        <div
          className="h-1.5 overflow-hidden rounded-full bg-ink"
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

        <h2 className="mt-4 font-display text-xl font-light text-paper sm:text-2xl">
          {STEP_LABELS[step - 1]}
        </h2>
      </div>

      <div className="space-y-6 px-6 py-8 sm:px-8">
        {showResumeBanner ? (
          <div
            role="status"
            className="rounded-sm border border-accent/30 bg-accent/10 px-4 py-4 sm:flex sm:items-center sm:justify-between sm:gap-4"
          >
            <div>
              <p className="text-sm font-medium text-paper">
                Resuming your saved assessment
              </p>
              <p className="mt-1 text-sm text-paper/55">
                Pick up where you left off on step {initialStep}, or continue
                editing from here.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowResumeBanner(false)}
              className="mt-3 shrink-0 rounded-sm bg-accent px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-accent-light sm:mt-0"
            >
              Continue
            </button>
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="rounded-sm border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200"
          >
            {error}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-5">
            <div>
              <FieldLabel htmlFor="companyName">Company name</FieldLabel>
              <TextInput
                id="companyName"
                value={formData.companyName}
                onChange={() => {}}
                disabled
              />
              <p className="mt-1.5 text-xs text-paper/45">
                <Link
                  href="/dashboard/settings"
                  className="text-accent-light underline-offset-4 hover:underline"
                >
                  Edit in Settings
                </Link>
              </p>
            </div>
            <div>
              <FieldLabel htmlFor="industry">Industry</FieldLabel>
              <TextInput
                id="industry"
                value={companyProfile.industry}
                onChange={() => {}}
                disabled
              />
              <p className="mt-1.5 text-xs text-paper/45">
                <Link
                  href="/dashboard/settings"
                  className="text-accent-light underline-offset-4 hover:underline"
                >
                  Edit in Settings
                </Link>
              </p>
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
              <legend className="text-sm font-medium text-paper/90">
                How comfortable are you with AI? (1 = not at all, 5 = very)
              </legend>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => updateForm({ comfortLevel: level })}
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-sm border text-sm font-medium transition-colors",
                      formData.comfortLevel === level
                        ? "border-accent bg-accent text-paper"
                        : "border-rule/20 bg-ink/40 text-paper/80 hover:border-accent/40",
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
            <div>
              <RadioGroup
                label="Who would own AI tools day-to-day? (optional)"
                name="aiOwner"
                options={AI_OWNER_OPTIONS}
                value={formData.aiOwner ?? ""}
                onChange={(aiOwner) => updateForm({ aiOwner })}
              />
              <p className="mt-1.5 text-xs text-paper/45">
                Helps us tailor your setup sessions and training materials.
              </p>
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="space-y-8">
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-paper/90">
              What are your top goals? (Select up to 3)
            </legend>
            <p className="text-xs text-paper/45">
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
                      "flex items-center gap-3 rounded-sm border px-4 py-3 text-sm transition-colors",
                      selected
                        ? "border-accent bg-accent/10 text-paper"
                        : disabled
                          ? "cursor-not-allowed border-rule/15 bg-ink/20 text-paper/35 opacity-60"
                          : "cursor-pointer border-rule/20 bg-ink/40 text-paper/80 hover:border-accent/40",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={disabled}
                      onChange={() => toggleGoal(goal)}
                      className="h-4 w-4 accent-accent-light"
                    />
                    {goal}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <div>
            <RadioGroup
              label="How do most new customers find you today? (optional)"
              name="marketingChannel"
              options={MARKETING_CHANNEL_OPTIONS}
              value={formData.marketingChannel ?? ""}
              onChange={(marketingChannel) => updateForm({ marketingChannel })}
            />
            <p className="mt-1.5 text-xs text-paper/45">
              Helps us prioritize automations that grow your strongest channel.
            </p>
          </div>
          </div>
        ) : null}

        {step === 6 ? (
          <div className="space-y-5">
            <p className="text-sm text-paper/55">
              These numbers let us calculate accurate, personalized ROI for your
              business. Every field is optional — leave any blank and we&apos;ll use
              a benchmark estimate for your size and industry.
            </p>
            {(() => {
              const questions = getIndustryQuestions(companyProfile.industry);
              if (questions.length === 0) {
                return (
                  <p className="rounded-sm border border-rule/20 bg-ink/40 px-4 py-3 text-sm text-paper/60">
                    No industry-specific numbers needed for your selection — your
                    deliverables will use cross-industry benchmarks. Continue to
                    the final step.
                  </p>
                );
              }
              const metrics: IndustryMetrics = formData.industryMetrics ?? {};
              const setMetric = (key: keyof IndustryMetrics, raw: string) => {
                const next: IndustryMetrics = { ...metrics };
                if (raw.trim() === "") delete next[key];
                else next[key] = Number(raw);
                updateForm({ industryMetrics: next });
              };
              return (
                <div className="grid gap-5 sm:grid-cols-2">
                  {questions.map((q) => {
                    const current = metrics[q.key];
                    return (
                      <div key={q.key}>
                        <FieldLabel htmlFor={q.key}>
                          {q.label}
                          {q.unit !== "#" ? ` (${q.unit})` : ""}
                        </FieldLabel>
                        <input
                          id={q.key}
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="any"
                          value={current ?? ""}
                          onChange={(e) => setMetric(q.key, e.target.value)}
                          placeholder={q.placeholder}
                          className="w-full rounded-sm border border-rule/25 bg-ink px-4 py-3 font-sans text-sm text-paper placeholder:text-paper/35 focus:border-accent-light/50 focus:outline-none focus:ring-2 focus:ring-accent-light/40"
                        />
                        {q.help ? (
                          <p className="mt-1.5 text-xs text-paper/45">{q.help}</p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        ) : null}

        {step === 7 ? (
          <div className="space-y-5">
            <div>
              <FieldLabel htmlFor="additionalNotes">
                Anything else we should know?
              </FieldLabel>
              <textarea
                id="additionalNotes"
                value={formData.additionalNotes}
                onChange={(e) =>
                  updateForm({ additionalNotes: e.target.value })
                }
                rows={5}
                className="w-full resize-y rounded-sm border border-rule/25 bg-ink px-4 py-3 font-sans text-sm text-paper placeholder:text-paper/35 focus:border-accent-light/50 focus:outline-none focus:ring-2 focus:ring-accent-light/40"
                placeholder="Optional — share context, priorities, or questions"
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule/15 px-6 py-5 sm:px-8">
        <div className="flex gap-2">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="rounded-sm border border-rule/25 px-5 py-2.5 font-sans text-sm font-medium text-paper/80 transition-colors hover:bg-ink/60"
            >
              Previous
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={() => void handleSaveAndExit()}
            className="rounded-sm border border-rule/25 px-5 py-2.5 font-sans text-sm font-medium text-paper/60 transition-colors hover:bg-ink/60 hover:text-paper/80"
          >
            Save &amp; Exit
          </button>
        </div>

        {step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={handleNext}
            className="rounded-sm bg-accent px-6 py-2.5 font-sans text-sm font-medium text-paper transition-colors hover:bg-accent-light"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleComplete()}
            disabled={isSubmitting}
            className="rounded-sm bg-accent px-6 py-2.5 font-sans text-sm font-medium text-paper transition-colors hover:bg-accent-light disabled:opacity-60"
          >
            {isSubmitting ? "Submitting…" : "Complete My Assessment"}
          </button>
        )}
      </div>
    </div>
  );
}
