import { cn } from "@/lib/utils";

export function AuthCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full max-w-[440px] rounded-sm border border-rule/20 bg-ink/80 p-8 shadow-2xl backdrop-blur-sm",
        className,
      )}
    >
      <header className="mb-8">
        <h1 className="font-display text-3xl font-light text-paper">{title}</h1>
        {subtitle ? (
          <p className="mt-2 font-sans text-sm leading-relaxed text-paper/60">
            {subtitle}
          </p>
        ) : null}
      </header>
      {children}
    </div>
  );
}
