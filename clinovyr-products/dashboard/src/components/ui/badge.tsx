import { cn } from "@/lib/cn";

type BadgeVariant = "success" | "warning" | "error" | "neutral";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  error: "bg-red-100 text-red-800",
  neutral: "bg-cream text-muted",
};

export function Badge({
  variant = "neutral",
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium font-mono uppercase tracking-wide",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function statusToBadge(
  status: "running" | "paused" | "error"
): BadgeVariant {
  switch (status) {
    case "running":
      return "success";
    case "paused":
      return "warning";
    case "error":
      return "error";
  }
}
