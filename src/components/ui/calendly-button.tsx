"use client";

import { useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

const CALENDLY_SCRIPT_SRC =
  "https://assets.calendly.com/assets/external/widget.js";
const CALENDLY_CSS_HREF =
  "https://assets.calendly.com/assets/external/widget.css";
const CALENDLY_DISCOVERY_URL = "https://calendly.com/clinovyr/discovery";

let calendlyAssetRefCount = 0;
let calendlyLinkEl: HTMLLinkElement | null = null;
let calendlyScriptEl: HTMLScriptElement | null = null;

function acquireCalendlyAssets() {
  calendlyAssetRefCount += 1;

  if (!document.querySelector(`link[href="${CALENDLY_CSS_HREF}"]`)) {
    calendlyLinkEl = document.createElement("link");
    calendlyLinkEl.rel = "stylesheet";
    calendlyLinkEl.href = CALENDLY_CSS_HREF;
    document.head.appendChild(calendlyLinkEl);
  }

  if (!document.querySelector(`script[src="${CALENDLY_SCRIPT_SRC}"]`)) {
    calendlyScriptEl = document.createElement("script");
    calendlyScriptEl.src = CALENDLY_SCRIPT_SRC;
    calendlyScriptEl.async = true;
    document.body.appendChild(calendlyScriptEl);
  }
}

function releaseCalendlyAssets() {
  calendlyAssetRefCount = Math.max(0, calendlyAssetRefCount - 1);

  if (calendlyAssetRefCount > 0) {
    return;
  }

  if (calendlyLinkEl?.parentNode) {
    calendlyLinkEl.parentNode.removeChild(calendlyLinkEl);
    calendlyLinkEl = null;
  }

  if (calendlyScriptEl?.parentNode) {
    calendlyScriptEl.parentNode.removeChild(calendlyScriptEl);
    calendlyScriptEl = null;
  }
}

type CalendlyButtonProps = {
  className?: string;
  label?: string;
};

export function CalendlyButton({
  className,
  label = "Book a Free Call",
}: CalendlyButtonProps) {
  useEffect(() => {
    acquireCalendlyAssets();
    return releaseCalendlyAssets;
  }, []);

  const handleClick = useCallback(() => {
    window.Calendly?.initPopupWidget({ url: CALENDLY_DISCOVERY_URL });
  }, []);

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center rounded-sm px-6 py-3",
        "font-sans text-sm font-medium transition-all duration-300",
        className,
      )}
      onClick={handleClick}
      aria-label={label}
    >
      {label}
    </button>
  );
}
