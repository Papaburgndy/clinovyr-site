"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const REDIRECT_SECONDS = 5;

type PaymentSuccessRedirectProps = {
  enabled: boolean;
};

export function PaymentSuccessRedirect({ enabled }: PaymentSuccessRedirectProps) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    if (!enabled) return;

    setSecondsLeft(REDIRECT_SECONDS);

    const intervalId = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalId);
          router.replace("/dashboard/deliverables");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [enabled, router]);

  if (!enabled) return null;

  return (
    <p className="font-sans text-sm text-paper/50">
      Redirecting to your deliverables in{" "}
      <span className="font-mono text-accent-light">{secondsLeft}</span>{" "}
      {secondsLeft === 1 ? "second" : "seconds"}…
    </p>
  );
}
