export default function Loading() {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center bg-paper px-6"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <div className="relative flex h-12 w-12 items-center justify-center">
        <div
          className="absolute inset-0 rounded-full border-2 border-accent/20"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-accent"
          aria-hidden="true"
        />
      </div>
      <p className="mt-6 font-display text-xl font-light text-ink">Clinovyr</p>
      <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-muted">
        Intelligence, Applied.
      </p>
    </div>
  );
}
