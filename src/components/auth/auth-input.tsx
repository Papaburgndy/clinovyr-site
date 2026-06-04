import { cn } from "@/lib/utils";

export function AuthLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.12em] text-paper/50"
    >
      {children}
    </label>
  );
}

export function AuthInput({
  id,
  type = "text",
  value,
  onChange,
  autoComplete,
  required,
  disabled,
  error,
  placeholder,
}: {
  id: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          "w-full rounded-sm border bg-ink px-4 py-3 font-sans text-sm text-paper",
          "placeholder:text-paper/30 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-accent-light/40",
          error
            ? "border-red-400/60 focus:border-red-400/60"
            : "border-rule/25 focus:border-accent-light/50",
          disabled && "cursor-not-allowed opacity-60",
        )}
      />
      {error ? (
        <p
          id={`${id}-error`}
          className="mt-1.5 font-sans text-xs text-red-300/90"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function AuthFieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="font-sans text-xs text-red-300/90" role="alert">
      {message}
    </p>
  );
}

export function AuthMessage({
  variant,
  children,
}: {
  variant: "success" | "error" | "info";
  children: React.ReactNode;
}) {
  const styles = {
    success: "border-accent/40 bg-accent/10 text-accent-light",
    error: "border-red-400/30 bg-red-950/40 text-red-200",
    info: "border-rule/30 bg-paper/5 text-paper/80",
  };

  return (
    <div
      className={cn(
        "rounded-sm border px-4 py-3 font-sans text-sm leading-relaxed",
        styles[variant],
      )}
      role={variant === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
