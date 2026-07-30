"use client";

import { useCallback, useEffect, useState } from "react";

const BUSINESS_KEY = "socialposter_selected_business";
const PLATFORM_KEY = "socialposter_selected_platform";

/**
 * Persists the selected business slug / platform across the app in
 * localStorage (not the URL) so every page shares the same "current
 * context" without needing Suspense boundaries around useSearchParams.
 */
export function useSelectedBusiness(fallback: string | null) {
  const [slug, setSlugState] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(BUSINESS_KEY);
    setSlugState(stored ?? fallback ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (fallback && !window.localStorage.getItem(BUSINESS_KEY)) {
      setSlugState(fallback);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fallback]);

  const setSlug = useCallback((next: string) => {
    setSlugState(next);
    window.localStorage.setItem(BUSINESS_KEY, next);
  }, []);

  return [slug, setSlug] as const;
}

export function useSelectedPlatform() {
  const [platform, setPlatformState] = useState<string>("all");

  useEffect(() => {
    const stored = window.localStorage.getItem(PLATFORM_KEY);
    if (stored) setPlatformState(stored);
  }, []);

  const setPlatform = useCallback((next: string) => {
    setPlatformState(next);
    window.localStorage.setItem(PLATFORM_KEY, next);
  }, []);

  return [platform, setPlatform] as const;
}
