import { cn } from "@/lib/utils";
import type { PasswordStrength } from "@/lib/auth-validation";

const LABELS: Record<Exclude<PasswordStrength, "empty">, string> = {
  weak: "Weak",
  fair: "Fair",
  strong: "Strong",
};

const BAR_COLORS: Record<Exclude<PasswordStrength, "empty">, string> = {
  weak: "bg-red-400/80",
  fair: "bg-gold/80",
  strong: "bg-accent-light",
};

export function PasswordStrengthMeter({
  strength,
}: {
  strength: PasswordStrength;
}) {
  if (strength === "empty") return null;

  const level =
    strength === "weak" ? 1 : strength === "fair" ? 2 : 3;

  return (
    <div className="mt-2" aria-live="polite">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-paper/40">
          Password strength
        </span>
        <span
          className={cn(
            "font-mono text-[10px] uppercase tracking-[0.1em]",
            strength === "weak" && "text-red-300/90",
            strength === "fair" && "text-gold",
            strength === "strong" && "text-accent-light",
          )}
        >
          {LABELS[strength]}
        </span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3].map((bar) => (
          <div
            key={bar}
            className={cn(
              "h-1 flex-1 rounded-full bg-paper/10 transition-colors",
              bar <= level && BAR_COLORS[strength],
            )}
          />
        ))}
      </div>
    </div>
  );
}
