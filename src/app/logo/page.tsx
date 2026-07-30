"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, BusinessProfile, imageUrl, Logo } from "@/lib/api";
import { useSelectedBusiness } from "@/lib/useSelection";
import BusinessSwitcher from "@/components/BusinessSwitcher";

export default function LogoMakerPage() {
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [businessesLoading, setBusinessesLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useSelectedBusiness(null);

  const [logos, setLogos] = useState<Logo[]>([]);
  const [logosLoading, setLogosLoading] = useState(true);

  const [brief, setBrief] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingLogoId, setEditingLogoId] = useState<number | null>(null);
  const [editInstructions, setEditInstructions] = useState("");
  const [editing, setEditing] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const selectedBusiness = useMemo(
    () => businesses.find((b) => b.slug === selectedSlug) ?? null,
    [businesses, selectedSlug],
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

  const refreshLogos = useCallback(async (business: string | null) => {
    if (!business) return;
    setLogosLoading(true);
    try {
      const list = await api.listLogos(business);
      setLogos(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load logos.");
    } finally {
      setLogosLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshLogos(selectedSlug);
  }, [selectedSlug, refreshLogos]);

  async function handleGenerate() {
    if (!selectedSlug) return;
    setGenerating(true);
    setError(null);
    try {
      await api.generateLogo(selectedSlug, brief.trim() || undefined);
      await refreshLogos(selectedSlug);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate logo.");
    } finally {
      setGenerating(false);
    }
  }

  function startEdit(logo: Logo) {
    setEditingLogoId(logo.id);
    setEditInstructions("");
  }

  async function handleEdit(logoId: number) {
    if (!editInstructions.trim()) return;
    setEditing(true);
    setError(null);
    try {
      await api.editLogo(logoId, editInstructions.trim());
      setEditingLogoId(null);
      setEditInstructions("");
      await refreshLogos(selectedSlug);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to edit logo.");
    } finally {
      setEditing(false);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await api.deleteLogo(id);
      await refreshLogos(selectedSlug);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete logo.");
    } finally {
      setDeletingId(null);
    }
  }

  if (businessesLoading) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-56 animate-pulse rounded-[var(--radius-token-md)] bg-[var(--border)]" />
        <div className="h-40 animate-pulse rounded-[var(--radius-token-lg)] bg-[var(--surface)] border border-[var(--border)]" />
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Logo Maker</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Generate a logo from the business&apos;s details, then refine it with edit
            instructions.
          </p>
        </div>
        <BusinessSwitcher
          businesses={businesses}
          selected={selectedBusiness}
          onSelect={(slug) => setSelectedSlug(slug)}
        />
      </div>

      <section className="flex flex-col gap-3 rounded-[var(--radius-token-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-token-sm)]">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            Direction (optional)
            {selectedBusiness ? (
              <span className="font-normal text-[var(--muted)]"> for {selectedBusiness.name}</span>
            ) : null}
          </span>
          <textarea
            rows={3}
            className="input"
            placeholder="e.g. minimalist icon only, no wordmark. Or: use deep purple and gold. Leave blank to let it decide based on the business description."
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
          />
        </label>
        <div>
          <button
            onClick={handleGenerate}
            disabled={generating || !selectedSlug}
            className="rounded-[var(--radius-token-md)] bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] shadow-[var(--shadow-token-sm)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generating ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Generating logo...
              </span>
            ) : (
              "Generate Logo"
            )}
          </button>
        </div>
      </section>

      {error && (
        <div className="animate-fade-in flex items-start gap-2 rounded-[var(--radius-token-md)] bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="mt-0.5 shrink-0">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16h.01" strokeLinecap="round" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-[var(--muted)]">
          {logosLoading ? "Loading logos..." : `${logos.length} logo${logos.length === 1 ? "" : "s"}`}
        </h2>

        {logosLoading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-square animate-pulse rounded-[var(--radius-token-lg)] bg-[var(--surface)] border border-[var(--border)]" />
            ))}
          </div>
        )}

        {!logosLoading && logos.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-[var(--radius-token-lg)] border border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-6 py-14 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="9" cy="9" r="2" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold">No logos yet</h3>
            <p className="max-w-xs text-sm text-[var(--muted)]">
              Generate your first logo for {selectedBusiness?.name ?? "this business"} above.
            </p>
          </div>
        )}

        {!logosLoading && logos.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {logos.map((logo) => (
              <div
                key={logo.id}
                className="animate-fade-in overflow-hidden rounded-[var(--radius-token-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-token-sm)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl(logo.imageUrl)}
                  alt={`Logo ${logo.id}`}
                  className="aspect-square w-full bg-white object-contain p-3"
                />
                <div className="flex flex-col gap-2 p-3">
                  <div className="flex items-center justify-between text-xs text-[var(--subtle)]">
                    <span>{new Date(logo.createdAt).toLocaleDateString()}</span>
                    {logo.parentLogoId && <span>Edited from #{logo.parentLogoId}</span>}
                  </div>

                  {editingLogoId === logo.id ? (
                    <div className="space-y-2">
                      <textarea
                        rows={2}
                        autoFocus
                        className="input text-xs"
                        placeholder="e.g. make the icon bigger, use a rounder font"
                        value={editInstructions}
                        onChange={(e) => setEditInstructions(e.target.value)}
                      />
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleEdit(logo.id)}
                          disabled={editing || !editInstructions.trim()}
                          className="flex-1 rounded-[var(--radius-token-sm)] bg-[var(--accent)] px-2 py-1.5 text-xs font-medium text-[var(--accent-foreground)] disabled:opacity-50"
                        >
                          {editing ? "Editing..." : "Apply Edit"}
                        </button>
                        <button
                          onClick={() => setEditingLogoId(null)}
                          className="rounded-[var(--radius-token-sm)] border border-[var(--border)] px-2 py-1.5 text-xs hover:bg-[var(--accent-soft)]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      <a
                        href={imageUrl(logo.imageUrl)}
                        download
                        className="rounded-[var(--radius-token-sm)] border border-[var(--border)] px-2 py-1 text-xs font-medium hover:bg-[var(--accent-soft)]"
                      >
                        Download
                      </a>
                      <button
                        onClick={() => startEdit(logo)}
                        className="rounded-[var(--radius-token-sm)] border border-[var(--border)] px-2 py-1 text-xs font-medium hover:bg-[var(--accent-soft)]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(logo.id)}
                        disabled={deletingId === logo.id}
                        className="rounded-[var(--radius-token-sm)] border border-[var(--border)] px-2 py-1 text-xs font-medium text-[var(--danger)] hover:bg-[var(--danger-soft)] disabled:opacity-50"
                      >
                        {deletingId === logo.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

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
