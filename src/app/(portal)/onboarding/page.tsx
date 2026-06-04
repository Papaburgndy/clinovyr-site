import type { Metadata } from "next";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export const metadata: Metadata = {
  title: "Onboarding",
  description: "Complete your Clinovyr company profile and goals.",
};

export default function OnboardingPage() {
  return (
    <main className="flex w-full flex-1 flex-col items-center justify-center pb-8">
      <OnboardingWizard />
    </main>
  );
}
