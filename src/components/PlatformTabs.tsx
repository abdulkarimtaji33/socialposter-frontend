"use client";

import { PostPlatform } from "@/lib/api";

export const PLATFORM_META: Record<
  PostPlatform,
  { label: string; color: string; icon: React.ReactNode }
> = {
  linkedin: {
    label: "LinkedIn",
    color: "var(--linkedin)",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
      </svg>
    ),
  },
  facebook: {
    label: "Facebook",
    color: "var(--facebook)",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94z" />
      </svg>
    ),
  },
  instagram: {
    label: "Instagram",
    color: "var(--instagram)",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2c2.72 0 3.06.01 4.12.06 1.06.05 1.79.22 2.43.47.66.26 1.22.6 1.77 1.15.55.55.9 1.11 1.15 1.77.25.64.42 1.37.47 2.43.05 1.06.06 1.4.06 4.12s-.01 3.06-.06 4.12c-.05 1.06-.22 1.79-.47 2.43a4.9 4.9 0 0 1-1.15 1.77 4.9 4.9 0 0 1-1.77 1.15c-.64.25-1.37.42-2.43.47-1.06.05-1.4.06-4.12.06s-3.06-.01-4.12-.06c-1.06-.05-1.79-.22-2.43-.47a4.9 4.9 0 0 1-1.77-1.15 4.9 4.9 0 0 1-1.15-1.77c-.25-.64-.42-1.37-.47-2.43C2.01 15.06 2 14.72 2 12s.01-3.06.06-4.12c.05-1.06.22-1.79.47-2.43.26-.66.6-1.22 1.15-1.77A4.9 4.9 0 0 1 5.45.53c.64-.25 1.37-.42 2.43-.47C8.94 2.01 9.28 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm5.2-8.4a1.17 1.17 0 1 0 0-2.33 1.17 1.17 0 0 0 0 2.33z" />
      </svg>
    ),
  },
};

export default function PlatformTabs({
  value,
  onChange,
  includeAll = true,
}: {
  value: string;
  onChange: (v: string) => void;
  includeAll?: boolean;
}) {
  const tabs: { key: string; label: string }[] = [
    ...(includeAll ? [{ key: "all", label: "All platforms" }] : []),
    { key: "linkedin", label: PLATFORM_META.linkedin.label },
    { key: "facebook", label: PLATFORM_META.facebook.label },
    { key: "instagram", label: PLATFORM_META.instagram.label },
  ];

  return (
    <div
      role="tablist"
      aria-label="Filter by platform"
      className="inline-flex items-center gap-1 rounded-[var(--radius-token-md)] border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-token-sm)]"
    >
      {tabs.map((t) => {
        const active = value === t.key;
        const meta = PLATFORM_META[t.key as PostPlatform];
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className={`inline-flex items-center gap-1.5 rounded-[calc(var(--radius-token-md)-2px)] px-3 py-1.5 text-sm font-medium transition ${
              active
                ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[var(--shadow-token-sm)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {meta && (
              <span
                style={{ color: active ? "currentColor" : meta.color }}
                className="flex"
              >
                {meta.icon}
              </span>
            )}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
