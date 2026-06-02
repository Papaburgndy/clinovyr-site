import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Services", href: "#services" },
  { label: "About", href: "#about" },
  { label: "How It Works", href: "#process" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
] as const;

function FooterLink({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "font-sans text-sm text-paper/70 transition-colors duration-300 hover:text-accent-light",
        className,
      )}
    >
      {label}
    </a>
  );
}

export function Footer() {
  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <a
              href="#"
              className="group inline-flex items-center gap-1.5 font-display text-2xl font-light tracking-tight text-paper transition-colors duration-300 hover:text-accent-light"
              aria-label="Clinovyr home"
            >
              Clinovyr
              <span
                className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-accent-light transition-transform duration-300 group-hover:scale-125"
                aria-hidden="true"
              />
            </a>
            <p className="mt-4 font-display text-lg font-light italic text-paper/90">
              Intelligence, Applied.
            </p>
            <p className="mt-4 max-w-sm font-sans text-sm leading-relaxed text-paper/70">
              AI consulting for Placer County businesses — practical guidance
              to save time, reduce costs, and grow.
            </p>
            <p className="mt-6 font-mono text-xs uppercase tracking-widest text-paper/70">
              Granite Bay / Roseville, California
            </p>
          </div>

          <div className="lg:col-span-3 lg:col-start-7">
            <p className="font-mono text-xs uppercase tracking-widest text-paper/70">
              Navigation
            </p>
            <nav
              className="mt-4 flex flex-col gap-3"
              aria-label="Footer navigation"
            >
              {NAV_LINKS.map((link) => (
                <FooterLink key={link.href} href={link.href} label={link.label} />
              ))}
            </nav>
          </div>

          <div className="lg:col-span-4">
            <p className="font-mono text-xs uppercase tracking-widest text-paper/70">
              Get in Touch
            </p>
            <p className="mt-4 font-sans text-sm leading-relaxed text-paper/70">
              Ready to explore what AI can do for your business? Start with a
              conversation.
            </p>
            <a
              href="mailto:clinovyr@gmail.com"
              className="mt-4 inline-block font-sans text-sm text-accent-light transition-colors duration-300 hover:text-paper"
            >
              clinovyr@gmail.com
            </a>
            <div className="mt-6">
              <a
                href="#contact"
                className={cn(
                  "inline-flex items-center justify-center rounded-sm px-5 py-2.5 font-sans text-sm font-medium transition-all duration-300",
                  "bg-accent text-paper hover:-translate-y-0.5 hover:bg-accent-light hover:shadow-md",
                )}
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-rule">
        <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
          <p className="font-mono text-xs text-paper/70">
            © 2026 Clinovyr LLC. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
