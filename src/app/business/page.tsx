"use client";

import { useEffect, useMemo, useState } from "react";
import { api, BusinessProfile, LinkedInStatus, PostPlatform } from "@/lib/api";
import { useSelectedBusiness } from "@/lib/useSelection";
import BusinessSwitcher from "@/components/BusinessSwitcher";
import { PLATFORM_META } from "@/components/PlatformTabs";

const emptyForm = {
  name: "",
  description: "",
  products: "",
  metaPromptTemplate: "",
  linkedinPromptTemplate: "",
  productPostPromptTemplate: "",
  autoPublish: false,
  autoScheduleEnabled: false,
  scheduleCron: "",
  scheduleTimezone: "Asia/Dubai",
  schedulePlatforms: "facebook,instagram",
};

type Form = typeof emptyForm;

const SCHEDULE_PLATFORM_OPTIONS: PostPlatform[] = ["linkedin", "facebook", "instagram"];

const CRON_PRESETS = [
  { label: "Once daily at 20:00", value: "0 20 * * *" },
  { label: "Once daily at 09:00", value: "0 9 * * *" },
  { label: "Twice daily (09:00 & 18:00)", value: "0 9,18 * * *" },
  { label: "Every weekday at 10:00", value: "0 10 * * 1-5" },
];

export default function BusinessPage() {
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [businessesLoading, setBusinessesLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useSelectedBusiness(null);

  const [form, setForm] = useState<Form>(emptyForm);
  const [initialForm, setInitialForm] = useState<Form>(emptyForm);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [linkedin, setLinkedin] = useState<LinkedInStatus>({ connected: false });
  const [linkedinBusy, setLinkedinBusy] = useState(false);

  const [linkedinParam, setLinkedinParam] = useState<string | null>(null);
  useEffect(() => {
    setLinkedinParam(new URLSearchParams(window.location.search).get("linkedin"));
  }, []);

  const selectedBusiness = useMemo(
    () => businesses.find((b) => b.slug === selectedSlug) ?? null,
    [businesses, selectedSlug],
  );

  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initialForm),
    [form, initialForm],
  );

  useEffect(() => {
    api
      .listBusinesses()
      .then(setBusinesses)
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Failed to load businesses."))
      .finally(() => setBusinessesLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedSlug && businesses.length > 0) {
      setSelectedSlug(businesses[0].slug);
    }
  }, [businesses, selectedSlug, setSelectedSlug]);

  useEffect(() => {
    if (!selectedSlug) return;
    setProfileLoading(true);
    setMessage(null);
    setError(null);
    api
      .getBusinessBySlug(selectedSlug)
      .then((profile: BusinessProfile | null) => {
        const next: Form = {
          name: profile?.name ?? "",
          description: profile?.description ?? "",
          products: profile?.products ?? "",
          metaPromptTemplate: profile?.metaPromptTemplate ?? "",
          linkedinPromptTemplate: profile?.linkedinPromptTemplate ?? "",
          productPostPromptTemplate: profile?.productPostPromptTemplate ?? "",
          autoPublish: profile?.autoPublish ?? false,
          autoScheduleEnabled: profile?.autoScheduleEnabled ?? false,
          scheduleCron: profile?.scheduleCron ?? "",
          scheduleTimezone: profile?.scheduleTimezone ?? "Asia/Dubai",
          schedulePlatforms: profile?.schedulePlatforms ?? "facebook,instagram",
        };
        setForm(next);
        setInitialForm(next);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load business."))
      .finally(() => setProfileLoading(false));
  }, [selectedSlug]);

  useEffect(() => {
    if (!selectedSlug) return;
    api
      .linkedinStatus(selectedSlug)
      .then(setLinkedin)
      .catch(() => setLinkedin({ connected: false }));
  }, [selectedSlug, linkedinParam]);

  useEffect(() => {
    if (linkedinParam === "connected") {
      setMessage("LinkedIn connected.");
    } else if (linkedinParam === "error") {
      setError("Failed to connect LinkedIn. Please try again.");
    }
    if (linkedinParam) {
      window.history.replaceState(null, "", "/business");
    }
  }, [linkedinParam]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlug) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await api.updateBusiness(selectedSlug, form);
      setInitialForm(form);
      setMessage("Business details saved.");
      // Keep businesses list (used by the switcher elsewhere) in sync.
      setBusinesses((prev) =>
        prev.map((b) => (b.slug === selectedSlug ? { ...b, ...form } : b)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setMessage(null);
  }

  function toggleSchedulePlatform(p: PostPlatform) {
    const current = form.schedulePlatforms
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    const next = current.includes(p)
      ? current.filter((x) => x !== p)
      : [...current, p];
    update("schedulePlatforms", next.length ? next.join(",") : p);
  }

  async function handleConnectLinkedIn() {
    if (!selectedSlug) return;
    setLinkedinBusy(true);
    try {
      const { url } = await api.linkedinAuthUrl(selectedSlug);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start LinkedIn connect.");
      setLinkedinBusy(false);
    }
  }

  async function handleDisconnectLinkedIn() {
    if (!selectedSlug) return;
    setLinkedinBusy(true);
    try {
      await api.linkedinDisconnect(selectedSlug);
      setLinkedin({ connected: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect LinkedIn.");
    } finally {
      setLinkedinBusy(false);
    }
  }

  if (businessesLoading) {
    return (
      <div className="max-w-2xl space-y-4">
        <div className="h-9 w-56 animate-pulse rounded-[var(--radius-token-md)] bg-[var(--border)]" />
        <div className="h-64 animate-pulse rounded-[var(--radius-token-lg)] bg-[var(--surface)] border border-[var(--border)]" />
      </div>
    );
  }

  if (loadError && businesses.length === 0) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--danger-soft)] text-[var(--danger)]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16h.01" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="text-lg font-semibold">Couldn&apos;t load businesses</h1>
        <p className="max-w-sm text-sm text-[var(--muted)]">{loadError}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-1 rounded-[var(--radius-token-md)] border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--accent-soft)]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Business Details</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Tell us about the business. This is used to generate its daily marketing posts.
          </p>
        </div>
        <BusinessSwitcher
          businesses={businesses}
          selected={selectedBusiness}
          onSelect={(slug) => setSelectedSlug(slug)}
        />
      </div>

      {/* LinkedIn connect, per business */}
      <section className="mb-4 flex flex-col gap-3 rounded-[var(--radius-token-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-token-sm)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: PLATFORM_META.linkedin.color }}
          >
            {PLATFORM_META.linkedin.icon}
          </span>
          <div>
            <h2 className="text-sm font-semibold">
              LinkedIn{selectedBusiness ? ` for ${selectedBusiness.name}` : ""}
            </h2>
            <p className="text-sm text-[var(--muted)]">
              {linkedin.connected
                ? `Connected as ${linkedin.name ?? "your account"}`
                : "Not connected. Connect an account to publish LinkedIn posts for this business."}
            </p>
          </div>
        </div>
        {linkedin.connected ? (
          <button
            onClick={handleDisconnectLinkedIn}
            disabled={linkedinBusy}
            className="whitespace-nowrap rounded-[var(--radius-token-md)] border border-[var(--border)] px-3 py-1.5 text-sm font-medium transition hover:border-[var(--border-strong)] hover:bg-[var(--accent-soft)] disabled:opacity-50"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={handleConnectLinkedIn}
            disabled={linkedinBusy}
            className="whitespace-nowrap rounded-[var(--radius-token-md)] px-3.5 py-1.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50"
            style={{ backgroundColor: PLATFORM_META.linkedin.color }}
          >
            Connect LinkedIn
          </button>
        )}
      </section>

      {profileLoading ? (
        <div className="h-96 animate-pulse rounded-[var(--radius-token-lg)] border border-[var(--border)] bg-[var(--surface)]" />
      ) : (
        <form
          key={selectedSlug}
          onSubmit={handleSubmit}
          className="space-y-4 rounded-[var(--radius-token-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-token-sm)]"
        >
          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              Business name <span className="text-[var(--danger)]">*</span>
            </span>
            <input
              required
              className="input"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              About this business <span className="text-[var(--danger)]">*</span>
            </span>
            <textarea
              required
              rows={10}
              className="input"
              placeholder="What does the business do, who it's for, its tone of voice, unique selling points, website, location — anything that should shape its marketing posts."
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              Products / tools to occasionally spotlight (optional)
            </span>
            <textarea
              rows={4}
              className="input"
              placeholder={
                "One per line, e.g.:\nMoonstone Ring Collection (https://zenzicly.com/moonstone) — hand-set gemstone rings, our best-seller"
              }
              value={form.products}
              onChange={(e) => update("products", e.target.value)}
            />
            <span className="mt-1 block text-xs text-[var(--subtle)]">
              Every generated post has a small random chance of promoting one of these
              specific products instead of the business in general.
            </span>
          </label>

          <details className="group rounded-[var(--radius-token-sm)] border border-[var(--border)] bg-[var(--background)] p-3 open:pb-4">
            <summary className="cursor-pointer text-sm font-medium select-none">
              Advanced: AI prompts
              <span className="ml-1.5 font-normal text-[var(--subtle)]">
                (optional — customize how posts are generated for this business)
              </span>
            </summary>
            <div className="mt-3 space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">
                  Facebook / Instagram prompt template
                </span>
                <textarea
                  rows={10}
                  className="input font-mono text-xs"
                  placeholder="Leave blank to use the default prompt."
                  value={form.metaPromptTemplate}
                  onChange={(e) => update("metaPromptTemplate", e.target.value)}
                />
                <span className="mt-1 block text-xs text-[var(--subtle)]">
                  Leave blank to use the built-in default. Available placeholders:{" "}
                  <code>{"{businessName}"}</code>, <code>{"{businessDescription}"}</code>,{" "}
                  <code>{"{angle}"}</code>, <code>{"{visualDescription}"}</code>,{" "}
                  <code>{"{spotlightInstruction}"}</code>,{" "}
                  <code>{"{recentCaptionsBlock}"}</code>. Must still ask for strict JSON
                  with <code>imagePrompt</code>, <code>caption</code>, and{" "}
                  <code>hashtags</code> fields.
                </span>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">
                  LinkedIn prompt template
                </span>
                <textarea
                  rows={8}
                  className="input font-mono text-xs"
                  placeholder="Leave blank to use the default prompt."
                  value={form.linkedinPromptTemplate}
                  onChange={(e) => update("linkedinPromptTemplate", e.target.value)}
                />
                <span className="mt-1 block text-xs text-[var(--subtle)]">
                  Leave blank to use the built-in default. Available placeholders:{" "}
                  <code>{"{businessName}"}</code>, <code>{"{businessDescription}"}</code>,{" "}
                  <code>{"{spotlightInstruction}"}</code>. Must still ask for strict JSON
                  with <code>imagePrompt</code>, <code>caption</code>, and{" "}
                  <code>hashtags</code> fields.
                </span>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">
                  Product Post copywriter prompt template
                </span>
                <textarea
                  rows={10}
                  className="input font-mono text-xs"
                  placeholder="Leave blank to use the default prompt."
                  value={form.productPostPromptTemplate}
                  onChange={(e) => update("productPostPromptTemplate", e.target.value)}
                />
                <span className="mt-1 block text-xs text-[var(--subtle)]">
                  Governs only the copy written from an uploaded product photo (on the
                  Product Post page), not the image design itself. Leave blank to use the
                  built-in default. Available placeholders: <code>{"{businessName}"}</code>,{" "}
                  <code>{"{businessDescription}"}</code>, <code>{"{brief}"}</code>. Must
                  still ask for strict JSON with <code>hook</code>, <code>ctaText</code>,{" "}
                  <code>caption</code>, and <code>hashtags</code> fields.
                </span>
              </label>
            </div>
          </details>

          <div className="rounded-[var(--radius-token-sm)] border border-[var(--border)] bg-[var(--background)] p-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.autoScheduleEnabled}
                onChange={(e) => update("autoScheduleEnabled", e.target.checked)}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              Auto-generate and publish on a schedule
            </label>

            {form.autoScheduleEnabled && (
              <div className="mt-3 space-y-4 pl-6">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">Schedule (cron)</span>
                  <div className="flex flex-wrap gap-2">
                    <input
                      className="input font-mono text-sm"
                      placeholder="0 20 * * *"
                      value={form.scheduleCron}
                      onChange={(e) => update("scheduleCron", e.target.value)}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {CRON_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => update("scheduleCron", preset.value)}
                        className={`rounded-full border px-2.5 py-1 text-xs transition ${
                          form.scheduleCron === preset.value
                            ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                            : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--accent-soft)]"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <span className="mt-1 block text-xs text-[var(--subtle)]">
                    Standard 5-field cron expression (minute hour day month weekday).
                  </span>
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium">Timezone</span>
                  <input
                    className="input"
                    placeholder="Asia/Dubai"
                    value={form.scheduleTimezone}
                    onChange={(e) => update("scheduleTimezone", e.target.value)}
                  />
                  <span className="mt-1 block text-xs text-[var(--subtle)]">
                    IANA timezone name, e.g. <code>Asia/Dubai</code>, <code>America/New_York</code>.
                  </span>
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium">Platforms</span>
                  <div className="flex flex-wrap gap-1.5">
                    {SCHEDULE_PLATFORM_OPTIONS.map((p) => {
                      const active = form.schedulePlatforms.split(",").includes(p);
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => toggleSchedulePlatform(p)}
                          aria-pressed={active}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                            active
                              ? "border-transparent text-white"
                              : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--accent-soft)]"
                          }`}
                          style={active ? { backgroundColor: PLATFORM_META[p].color } : undefined}
                        >
                          {PLATFORM_META[p].icon}
                          {PLATFORM_META[p].label}
                        </button>
                      );
                    })}
                  </div>
                  <span className="mt-1 block text-xs text-[var(--subtle)]">
                    Only platforms with a connected/configured account are actually used;
                    others are skipped automatically when the schedule fires.
                  </span>
                </label>
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.autoPublish}
              onChange={(e) => update("autoPublish", e.target.checked)}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            Automatically publish this business&apos;s legacy daily generated post
          </label>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={saving || !dirty}
              className="rounded-[var(--radius-token-md)] bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] shadow-[var(--shadow-token-sm)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Business Details"}
            </button>
            {dirty && !saving && (
              <span className="text-xs text-[var(--subtle)]">Unsaved changes</span>
            )}
          </div>

          {message && (
            <p className="flex items-center gap-1.5 text-sm text-[var(--success)]">
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                <path
                  d="M4 10.5L8 14.5L16 6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {message}
            </p>
          )}
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        </form>
      )}

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid var(--border);
          background: var(--background);
          color: var(--foreground);
          border-radius: var(--radius-token-sm);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
        .input:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 1px;
          border-color: var(--accent);
        }
      `}</style>
    </div>
  );
}
