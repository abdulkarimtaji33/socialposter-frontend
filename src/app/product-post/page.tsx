"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, BusinessProfile, imageUrl, Post, PostPlatform } from "@/lib/api";
import { useSelectedBusiness } from "@/lib/useSelection";
import BusinessSwitcher from "@/components/BusinessSwitcher";
import { PLATFORM_META } from "@/components/PlatformTabs";
import { PlatformBadge, StatusBadge } from "@/components/Badges";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const ALL_PLATFORMS: PostPlatform[] = ["linkedin", "facebook", "instagram"];

const GENERATION_STAGES = [
  { afterSeconds: 0, label: "Studying your product photo..." },
  { afterSeconds: 20, label: "Writing hook, content, and CTA..." },
  { afterSeconds: 45, label: "Designing the graphic around your product..." },
  { afterSeconds: 90, label: "Preserving your product while restyling the background..." },
  { afterSeconds: 150, label: "Almost there, finishing touches on the design..." },
];

export default function ProductPostPage() {
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [businessesLoading, setBusinessesLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useSelectedBusiness(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [brief, setBrief] = useState("");
  const [targets, setTargets] = useState<PostPlatform[]>(["facebook", "instagram"]);

  const [generating, setGenerating] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Post | null>(null);
  const [publishingKey, setPublishingKey] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setPhoto = useCallback(
    (file: File | null) => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPhotoFile(file);
      setPreviewUrl(file ? URL.createObjectURL(file) : null);
    },
    [previewUrl],
  );

  function validateAndSetPhoto(file: File): boolean {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Unsupported image type. Use PNG, JPEG, or WEBP.");
      return false;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("Image is too large. Max 5MB.");
      return false;
    }
    setError(null);
    setPhoto(file);
    return true;
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) validateAndSetPhoto(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetPhoto(file);
  }

  function toggleTarget(p: PostPlatform) {
    setTargets((prev) => {
      if (prev.includes(p)) {
        const next = prev.filter((x) => x !== p);
        return next.length > 0 ? next : prev;
      }
      return [...prev, p];
    });
  }

  async function handleGenerate() {
    if (!selectedSlug || !photoFile || !brief.trim()) return;
    setGenerating(true);
    setElapsed(0);
    setError(null);
    setResult(null);
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    try {
      const post = await api.generatePostFromPhoto({
        business: selectedSlug,
        photo: photoFile,
        brief: brief.trim(),
        targetPlatforms: targets,
      });
      setResult(post);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate post.");
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
      setGenerating(false);
    }
  }

  async function handlePublish(postId: number, platform: PostPlatform) {
    const key = `${postId}:${platform}`;
    setPublishingKey(key);
    setError(null);
    try {
      const updated = await api.publishPost(postId, platform);
      setResult(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish post.");
    } finally {
      setPublishingKey(null);
    }
  }

  const currentStage = [...GENERATION_STAGES].reverse().find((s) => elapsed >= s.afterSeconds);
  const canGenerate = !!selectedSlug && !!photoFile && !!brief.trim() && !generating;

  if (businessesLoading) {
    return (
      <div className="space-y-6">
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Product Post</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Upload a real product photo and a short brief. The AI writes SEO-aware
            hook/content/CTA copy and designs a graphic that keeps your actual
            product intact.
          </p>
        </div>
        <BusinessSwitcher
          businesses={businesses}
          selected={selectedBusiness}
          onSelect={(slug) => setSelectedSlug(slug)}
        />
      </div>

      <section className="flex flex-col gap-4 rounded-[var(--radius-token-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-token-sm)]">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            Product photo <span className="text-[var(--danger)]">*</span>
          </span>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-token-lg)] border-2 border-dashed border-[var(--border-strong)] bg-[var(--background)] px-6 py-8 text-center transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Product preview"
                className="max-h-56 rounded-[var(--radius-token-md)] object-contain"
              />
            ) : (
              <>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-[var(--subtle)]">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                <p className="text-sm text-[var(--muted)]">
                  Click or drag a product photo here
                </p>
                <p className="text-xs text-[var(--subtle)]">PNG, JPEG, or WEBP, up to 5MB</p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileInput}
          />
          {photoFile && (
            <div className="mt-2 flex items-center justify-between text-xs text-[var(--subtle)]">
              <span>{photoFile.name}</span>
              <button
                type="button"
                onClick={() => setPhoto(null)}
                className="font-medium text-[var(--accent)] hover:underline"
              >
                Remove
              </button>
            </div>
          )}
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            Brief <span className="text-[var(--danger)]">*</span>
          </span>
          <textarea
            rows={3}
            className="input"
            placeholder="e.g. handmade moonstone ring, our best-seller, launching this weekend"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
          />
        </label>

        <div>
          <span className="mb-1 block text-sm font-medium">Publish to</span>
          <div className="inline-flex overflow-hidden rounded-[var(--radius-token-md)] border border-[var(--border)]">
            {ALL_PLATFORMS.map((p) => {
              const active = targets.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => toggleTarget(p)}
                  aria-pressed={active}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <span style={{ color: active ? undefined : PLATFORM_META[p].color }}>
                    {PLATFORM_META[p].icon}
                  </span>
                  {PLATFORM_META[p].label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="rounded-[var(--radius-token-md)] bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] shadow-[var(--shadow-token-sm)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate Post"}
          </button>
        </div>
      </section>

      {generating && (
        <div className="animate-fade-in flex items-center gap-3 rounded-[var(--radius-token-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-token-sm)]">
          <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
          <p className="text-sm text-[var(--foreground)]">
            {currentStage?.label}{" "}
            <span className="text-[var(--subtle)]">({elapsed}s elapsed, can take up to 3-4 minutes)</span>
          </p>
        </div>
      )}

      {error && (
        <div className="animate-fade-in flex items-start gap-2 rounded-[var(--radius-token-md)] bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="mt-0.5 shrink-0">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16h.01" strokeLinecap="round" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {result && (
        <section className="animate-fade-in overflow-hidden rounded-[var(--radius-token-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-token-sm)]">
          <div className="flex flex-col sm:flex-row">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl(result.imageUrl)}
              alt={result.imagePrompt}
              className="h-64 w-full shrink-0 object-cover sm:h-auto sm:w-64"
            />
            <div className="flex flex-1 flex-col justify-between p-4">
              <div>
                <div className="mb-2.5 flex flex-wrap items-center gap-2">
                  {result.publications.map((pub) => (
                    <span key={pub.id} className="inline-flex items-center gap-1">
                      <PlatformBadge platform={pub.platform} />
                      <StatusBadge status={pub.status} />
                    </span>
                  ))}
                </div>
                <p className="whitespace-pre-wrap text-sm text-[var(--foreground)]">
                  {result.caption}
                </p>
                {result.hashtags && (
                  <p className="mt-2 text-sm text-[var(--accent)]">{result.hashtags}</p>
                )}
                {result.publications
                  .filter((pub) => pub.status === "failed" && pub.errorMessage)
                  .map((pub) => (
                    <p
                      key={pub.id}
                      className="mt-2 rounded-[var(--radius-token-sm)] bg-[var(--danger-soft)] px-2 py-1 text-xs text-[var(--danger)]"
                    >
                      {PLATFORM_META[pub.platform].label}: {pub.errorMessage}
                    </p>
                  ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {result.publications.map((pub) => {
                  if (pub.status === "published") return null;
                  const key = `${result.id}:${pub.platform}`;
                  return (
                    <button
                      key={pub.id}
                      onClick={() => handlePublish(result.id, pub.platform)}
                      disabled={publishingKey === key}
                      className="inline-flex items-center gap-1.5 rounded-[var(--radius-token-sm)] px-3 py-1.5 text-sm font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                      style={{ backgroundColor: PLATFORM_META[pub.platform].color }}
                    >
                      {publishingKey === key ? (
                        <>
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          Publishing...
                        </>
                      ) : (
                        `${pub.status === "failed" ? "Retry" : "Publish to"} ${PLATFORM_META[pub.platform].label}`
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
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
