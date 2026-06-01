import { LoginForm } from "@/components/auth/login-form";
import { emailProviderId } from "@/lib/auth";

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl font-semibold text-ink">
            Clinovyr
          </h1>
          <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted">
            Intelligence, Applied.
          </p>
        </div>
        <LoginForm
          callbackUrl={params.callbackUrl ?? "/dashboard"}
          providerId={emailProviderId}
        />
      </div>
    </div>
  );
}
