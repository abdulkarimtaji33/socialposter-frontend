"use client";

import { useEffect, useRef, useState } from "react";
import { BusinessProfile } from "@/lib/api";

const INITIALS_BG = [
  "bg-indigo-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-sky-500",
];

function initialsColor(id: number) {
  return INITIALS_BG[id % INITIALS_BG.length];
}

export default function BusinessSwitcher({
  businesses,
  selected,
  onSelect,
}: {
  businesses: BusinessProfile[];
  selected: BusinessProfile | null;
  onSelect: (slug: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-[var(--radius-token-md)] border border-[var(--border)] bg-[var(--surface)] py-1.5 pl-2 pr-3 text-sm font-medium shadow-[var(--shadow-token-sm)] transition hover:border-[var(--border-strong)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
      >
        {selected ? (
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ${initialsColor(
              selected.id,
            )}`}
          >
            {selected.name.slice(0, 1).toUpperCase()}
          </span>
        ) : (
          <span className="h-6 w-6 shrink-0 animate-pulse rounded-full bg-[var(--border)]" />
        )}
        <span className="max-w-[10rem] truncate">
          {selected?.name ?? "Select business"}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 20 20"
          fill="none"
          className={`shrink-0 text-[var(--subtle)] transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className="animate-fade-in absolute left-0 z-30 mt-2 w-64 overflow-hidden rounded-[var(--radius-token-md)] border border-[var(--border)] bg-[var(--surface-raised)] py-1.5 shadow-[var(--shadow-token-lg)]"
        >
          {businesses.map((b) => (
            <button
              key={b.slug}
              role="option"
              aria-selected={selected?.slug === b.slug}
              onClick={() => {
                onSelect(b.slug);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition hover:bg-[var(--accent-soft)] ${
                selected?.slug === b.slug
                  ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "text-[var(--foreground)]"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${initialsColor(
                  b.id,
                )}`}
              >
                {b.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="flex flex-col overflow-hidden">
                <span className="truncate font-medium">{b.name}</span>
                <span className="truncate text-xs text-[var(--muted)]">
                  {b.slug}
                </span>
              </span>
              {selected?.slug === b.slug && (
                <svg
                  className="ml-auto shrink-0"
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M4 10.5L8 14.5L16 6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
