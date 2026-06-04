import Link from "next/link";
import { cn } from "@/lib/utils";

export function AuthLogo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "font-display text-2xl font-light tracking-tight text-paper transition-colors hover:text-accent-light",
        className,
      )}
      aria-label="Clinovyr home"
    >
      Clinovyr
    </Link>
  );
}
