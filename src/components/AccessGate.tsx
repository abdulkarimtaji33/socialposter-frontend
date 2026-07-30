"use client";

import { useEffect, useState } from "react";
import { api, ApiError, setAccessKey } from "@/lib/api";

type Status = "checking" | "locked" | "unlocked";

export default function AccessGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<Status>("checking");
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  async function check() {
    try {
      await api.getBusiness();
      setStatus("unlocked");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setStatus("locked");
      } else {
        // backend unreachable or other error: don't block the UI on that.
        setStatus("unlocked");
      }
    }
  }

  useEffect(() => {
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setChecking(true);
    setError(null);
    setAccessKey(input.trim());
    try {
      await api.getBusiness();
      setStatus("unlocked");
    } catch {
      setError("Incorrect access key.");
    } finally {
      setChecking(false);
    }
  }

  if (status === "checking") {
    return null;
  }

  if (status === "locked") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm space-y-4 rounded-[var(--radius-token-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-token-md)]"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-token-md)] bg-[var(--accent)] text-sm font-bold text-[var(--accent-foreground)]">
              SP
            </span>
            <h1 className="text-lg font-semibold">Enter access key</h1>
          </div>
          <p className="text-sm text-[var(--muted)]">
            This app is protected. Enter the access key to continue.
          </p>
          <input
            type="password"
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full rounded-[var(--radius-token-md)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus-visible:border-[var(--accent)]"
            placeholder="Access key"
          />
          <button
            type="submit"
            disabled={checking}
            className="w-full rounded-[var(--radius-token-md)] bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {checking ? "Checking..." : "Continue"}
          </button>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
