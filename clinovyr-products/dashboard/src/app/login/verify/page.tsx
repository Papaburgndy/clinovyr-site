export default function VerifyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="max-w-md rounded-lg border border-rule bg-paper p-8 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Check your email
        </h1>
        <p className="mt-3 text-muted">
          A sign-in link has been sent to your email address. Click the link to
          access your dashboard.
        </p>
      </div>
    </div>
  );
}
