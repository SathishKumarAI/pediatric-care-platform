"use client";
// Shared loading / empty / error UI. Keeps every page consistent (PCP-6) and
// gives us a single place to evolve states (skeletons, retry, a11y).

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-2 text-sm text-subtext">
      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-surface1 border-t-mauve" />
      {label}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-surface1 bg-mantle px-4 py-6 text-center text-sm text-subtext">
      {children}
    </div>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex items-center justify-between rounded-lg border border-red/40 bg-mantle px-4 py-3 text-sm text-red">
      <span>⚠ {message}</span>
      {onRetry && (
        <button onClick={onRetry} className="ml-3 rounded-md border border-red/50 px-2 py-0.5 text-xs hover:bg-surface0">
          Retry
        </button>
      )}
    </div>
  );
}
