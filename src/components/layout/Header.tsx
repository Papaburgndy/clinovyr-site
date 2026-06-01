"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Services", href: "#services" },
  { label: "About", href: "#about" },
  { label: "How It Works", href: "#process" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
] as const;

const SECTION_IDS = NAV_LINKS.map((link) => link.href.slice(1));

function NavLink({
  href,
  label,
  isActive,
  isLight,
  onClick,
  className,
}: {
  href: string;
  label: string;
  isActive: boolean;
  isLight: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={cn(
        "group relative font-sans text-sm font-medium tracking-wide transition-colors duration-300",
        "after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:transition-transform after:duration-300 after:ease-out",
        isLight
          ? "text-paper/90 hover:text-paper after:bg-accent-light"
          : "text-ink/80 hover:text-ink after:bg-accent",
        isActive && "after:scale-x-100",
        isActive && (isLight ? "text-paper" : "text-accent"),
        "hover:after:scale-x-100",
        className,
      )}
      aria-current={isActive ? "true" : undefined}
    >
      {label}
    </a>
  );
}

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [overDarkHero, setOverDarkHero] = useState(true);
  const [activeSection, setActiveSection] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const useLightForeground = isScrolled || overDarkHero;

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 60);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) {
      setOverDarkHero(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setOverDarkHero(entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "-64px 0px 0px 0px" },
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sections = SECTION_IDS.map((id) =>
      document.getElementById(id),
    ).filter((section): section is HTMLElement => section !== null);

    if (sections.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target.id) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen || !mobileMenuRef.current) {
      return;
    }

    const container = mobileMenuRef.current;
    const focusable = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    first?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || focusable.length === 0) {
        return;
      }

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        }
        return;
      }

      if (document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300",
          isScrolled
            ? "border-b border-white/5 bg-ink/95 shadow-sm backdrop-blur-md"
            : "bg-transparent",
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:h-20 md:px-8">
          <a
            href="#"
            className={cn(
              "group flex items-center gap-1.5 font-display text-2xl font-light tracking-tight transition-colors duration-300 lg:text-[1.75rem]",
              useLightForeground
                ? "text-paper hover:text-accent-light"
                : "text-ink hover:text-accent",
            )}
            aria-label="Clinovyr home"
          >
            Clinovyr
            <span
              className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-accent-light transition-transform duration-300 group-hover:scale-125"
              aria-hidden="true"
            />
          </a>

          <nav
            className="hidden items-center gap-8 md:flex"
            aria-label="Main navigation"
          >
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                label={link.label}
                isActive={activeSection === link.href.slice(1)}
                isLight={useLightForeground}
              />
            ))}
          </nav>

          <div className="hidden items-center gap-4 md:flex">
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

          <button
            ref={menuButtonRef}
            type="button"
            className={cn(
              "inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm p-2 transition-colors duration-300 md:hidden",
              useLightForeground
                ? "text-paper hover:bg-white/10"
                : "text-ink hover:bg-ink/5",
            )}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-ink/40 transition-opacity duration-300 md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden="true"
        onClick={closeMobile}
      />

      <div
        ref={mobileMenuRef}
        id="mobile-navigation"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-ink shadow-2xl transition-transform duration-300 ease-out md:hidden",
          mobileOpen
            ? "translate-x-0"
            : "pointer-events-none translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        aria-hidden={!mobileOpen}
        inert={!mobileOpen ? true : undefined}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <a
            href="#"
            className="flex items-center gap-1.5 font-display text-2xl font-light text-paper"
            onClick={closeMobile}
          >
            Clinovyr
            <span
              className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-accent-light"
              aria-hidden="true"
            />
          </a>
          <button
            type="button"
            className="rounded-sm p-2 text-paper transition-colors hover:bg-white/10"
            aria-label="Close menu"
            onClick={closeMobile}
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <nav
          className="flex flex-1 flex-col gap-1 px-6 py-8"
          aria-label="Main navigation"
        >
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              label={link.label}
              isActive={activeSection === link.href.slice(1)}
              isLight
              onClick={closeMobile}
              className="py-3 text-lg after:bottom-2"
            />
          ))}
        </nav>

        <div className="border-t border-white/10 px-6 py-6">
          <a
            href="#contact"
            onClick={closeMobile}
            className="inline-flex w-full items-center justify-center rounded-sm bg-accent px-5 py-3 font-sans text-sm font-medium text-paper transition-all duration-300 hover:bg-accent-light"
          >
            Get Started
          </a>
        </div>
      </div>
    </>
  );
}
