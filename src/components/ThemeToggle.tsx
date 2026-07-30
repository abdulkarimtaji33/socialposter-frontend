"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
const KEY = "socialposter_theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const stored = (window.localStorage.getItem(KEY) as Theme) ?? "system";
    setTheme(stored);
    applyTheme(stored);
  }, []);

  function cycle() {
    const order: Theme[] = ["system", "light", "dark"];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
    window.localStorage.setItem(KEY, next);
    applyTheme(next);
  }

  const icons: Record<Theme, React.ReactNode> = {
    system: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M8 21h8M12 17v4" strokeLinecap="round" />
      </svg>
    ),
    light: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <circle cx="12" cy="12" r="4" />
        <path
          d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
          strokeLinecap="round"
        />
      </svg>
    ),
    dark: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M21 12.6A9 9 0 1 1 11.4 3a7 7 0 0 0 9.6 9.6z" strokeLinejoin="round" />
      </svg>
    ),
  };

  const labels: Record<Theme, string> = {
    system: "System theme",
    light: "Light theme",
    dark: "Dark theme",
  };

  return (
    <button
      type="button"
      onClick={cycle}
      title={`${labels[theme]} — click to change`}
      aria-label={`Theme: ${labels[theme]}. Click to switch.`}
      className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-token-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition hover:text-[var(--foreground)] hover:border-[var(--border-strong)]"
    >
      {icons[theme]}
    </button>
  );
}
