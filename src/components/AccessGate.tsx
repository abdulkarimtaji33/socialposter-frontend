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
          className="w-full max-w-sm space-y-4 rounded-lg border bg-white p-6"
        >
          <h1 className="text-lg font-semibold">Enter access key</h1>
          <p className="text-sm text-gray-600">
            This app is protected. Enter the access key to continue.
          </p>
          <input
            type="password"
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Access key"
          />
          <button
            type="submit"
            disabled={checking}
            className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {checking ? "Checking..." : "Continue"}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
