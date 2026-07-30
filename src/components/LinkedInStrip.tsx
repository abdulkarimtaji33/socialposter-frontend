"use client";

import { LinkedInStatus } from "@/lib/api";
import { PLATFORM_META } from "./PlatformTabs";

export default function LinkedInStrip({
  status,
  prominent,
  onConnect,
  onDisconnect,
}: {
  status: LinkedInStatus;
  prominent: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  if (!prominent) {
    // Small persistent status pill so it's always visible but not loud.
    return (
      <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
        <span style={{ color: PLATFORM_META.linkedin.color }} className="flex">
          {PLATFORM_META.linkedin.icon}
        </span>
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            status.connected ? "bg-[var(--success)]" : "bg-[var(--subtle)]"
          }`}
        />
        {status.connected
          ? `LinkedIn connected (${status.name ?? "account"})`
          : "LinkedIn not connected"}
        <button
          onClick={status.connected ? onDisconnect : onConnect}
          className="font-medium text-[var(--accent)] hover:underline"
        >
          {status.connected ? "Disconnect" : "Connect"}
        </button>
      </div>
    );
  }

  return (
    <section className="animate-fade-in flex flex-col gap-3 rounded-[var(--radius-token-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-token-sm)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{
            color: "white",
            backgroundColor: PLATFORM_META.linkedin.color,
          }}
        >
          {PLATFORM_META.linkedin.icon}
        </span>
        <div>
          <h2 className="text-sm font-semibold">LinkedIn account</h2>
          <p className="text-sm text-[var(--muted)]">
            {status.connected
              ? `Connected as ${status.name ?? "your account"}`
              : "Not connected for this business. Connect an account to publish LinkedIn posts."}
          </p>
        </div>
      </div>
      {status.connected ? (
        <button
          onClick={onDisconnect}
          className="whitespace-nowrap rounded-[var(--radius-token-md)] border border-[var(--border)] px-3 py-1.5 text-sm font-medium transition hover:border-[var(--border-strong)] hover:bg-[var(--accent-soft)]"
        >
          Disconnect
        </button>
      ) : (
        <button
          onClick={onConnect}
          className="whitespace-nowrap rounded-[var(--radius-token-md)] px-3.5 py-1.5 text-sm font-medium text-white transition hover:brightness-110"
          style={{ backgroundColor: PLATFORM_META.linkedin.color }}
        >
          Connect LinkedIn
        </button>
      )}
    </section>
  );
}
