"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  api,
  BusinessProfile,
  imageUrl,
  LinkedInStatus,
  Post,
  PostPlatform,
} from "@/lib/api";
import { useSelectedBusiness, useSelectedPlatform } from "@/lib/useSelection";
import BusinessSwitcher from "@/components/BusinessSwitcher";
import PlatformTabs from "@/components/PlatformTabs";
import { PlatformBadge, StatusBadge } from "@/components/Badges";
import LinkedInStrip from "@/components/LinkedInStrip";
import { PLATFORM_META } from "@/components/PlatformTabs";

const GENERATION_STAGES = [
  { afterSeconds: 0, label: "Writing your caption and image idea..." },
  { afterSeconds: 20, label: "Creating your marketing image..." },
  { afterSeconds: 60, label: "Still creating your image, almost there..." },
  { afterSeconds: 100, label: "Final touches — this one's taking a bit longer..." },
];

const ALL_PLATFORMS: PostPlatform[] = ["linkedin", "facebook", "instagram"];

export default function Home() {
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [businessesLoading, setBusinessesLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useSelectedBusiness(null);
  const [platform, setPlatform] = useSelectedPlatform();

  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [linkedin, setLinkedin] = useState<LinkedInStatus>({ connected: false });

  const [generating, setGenerating] = useState(false);
  const [genTargets, setGenTargets] = useState<PostPlatform[] | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [publishingKey, setPublishingKey] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editHashtags, setEditHashtags] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedBusiness = useMemo(
    () => businesses.find((b) => b.slug === selectedSlug) ?? null,
    [businesses, selectedSlug],
  );

  // Load business list once.
  useEffect(() => {
    api
      .listBusinesses()
      .then((list) => {
        setBusinesses(list);
        setLoadError(null);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Failed to load businesses."))
      .finally(() => setBusinessesLoading(false));
  }, []);

  // Default the business selection to the first one once loaded (if none stored).
  useEffect(() => {
    if (!selectedSlug && businesses.length > 0) {
      setSelectedSlug(businesses[0].slug);
    }
  }, [businesses, selectedSlug, setSelectedSlug]);

  // Sensible default generate-target platforms per business, unless the user picked manually.
  const defaultGenTargets: PostPlatform[] =
    selectedBusiness?.slug === "zenzicas" ? ["linkedin"] : ["facebook", "instagram"];
  const activeGenTargets = genTargets ?? defaultGenTargets;

  function toggleGenTarget(p: PostPlatform) {
    setGenTargets((prev) => {
      const base = prev ?? defaultGenTargets;
      if (base.includes(p)) {
        const next = base.filter((x) => x !== p);
        return next.length > 0 ? next : base; // keep at least one selected
      }
      return [...base, p];
    });
  }

  const refreshPosts = useCallback(async (business: string | null) => {
    if (!business) return;
    setPostsLoading(true);
    try {
      const list = await api.listPosts({ business });
      setPosts(list);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load posts.");
    } finally {
      setPostsLoading(false);
    }
  }, []);

  const refreshLinkedin = useCallback(async (business: string | null) => {
    if (!business) return;
    try {
      const status = await api.linkedinStatus(business);
      setLinkedin(status);
    } catch {
      // Non-fatal: LinkedIn status widget just stays "not connected".
    }
  }, []);

  useEffect(() => {
    refreshPosts(selectedSlug);
  }, [selectedSlug, refreshPosts]);

  useEffect(() => {
    refreshLinkedin(selectedSlug);
  }, [selectedSlug, refreshLinkedin]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const filteredPosts = useMemo(() => {
    if (platform === "all") return posts;
    return posts.filter((p) => p.publications.some((pub) => pub.platform === platform));
  }, [posts, platform]);

  async function handleGenerate() {
    if (!selectedSlug) return;
    setGenerating(true);
    setElapsed(0);
    setError(null);
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    try {
      const primaryPlatform = activeGenTargets.includes("facebook")
        ? "facebook"
        : activeGenTargets[0];
      await api.generatePost({
        business: selectedSlug,
        platform: primaryPlatform,
        targetPlatforms: activeGenTargets,
      });
      await refreshPosts(selectedSlug);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate post.");
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
      setGenerating(false);
    }
  }

  async function handlePublish(postId: number, targetPlatform: PostPlatform) {
    const key = `${postId}:${targetPlatform}`;
    setPublishingKey(key);
    setError(null);
    try {
      await api.publishPost(postId, targetPlatform);
      await refreshPosts(selectedSlug);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish post.");
    } finally {
      setPublishingKey(null);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    setError(null);
    try {
      await api.deletePost(id);
      await refreshPosts(selectedSlug);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete post.");
    } finally {
      setDeletingId(null);
    }
  }

  function startEdit(post: Post) {
    setEditingId(post.id);
    setEditCaption(post.caption);
    setEditHashtags(post.hashtags ?? "");
  }

  async function saveEdit(id: number) {
    try {
      await api.updatePost(id, { caption: editCaption, hashtags: editHashtags });
      setEditingId(null);
      await refreshPosts(selectedSlug);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes.");
    }
  }

  async function handleConnectLinkedIn() {
    if (!selectedSlug) return;
    try {
      const { url } = await api.linkedinAuthUrl(selectedSlug);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start LinkedIn connect.");
    }
  }

  async function handleDisconnectLinkedIn() {
    if (!selectedSlug) return;
    await api.linkedinDisconnect(selectedSlug);
    await refreshLinkedin(selectedSlug);
  }

  const currentStage = [...GENERATION_STAGES].reverse().find((s) => elapsed >= s.afterSeconds);
  const linkedinProminent = platform === "linkedin" || platform === "all";

  if (businessesLoading) {
    return <DashboardSkeleton />;
  }

  if (loadError && businesses.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
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
        <div className="flex flex-wrap items-center gap-3">
          <BusinessSwitcher
            businesses={businesses}
            selected={selectedBusiness}
            onSelect={(slug) => {
              setSelectedSlug(slug);
              setGenTargets(null);
            }}
          />
          <PlatformTabs value={platform} onChange={setPlatform} />
        </div>
        {!linkedinProminent && (
          <LinkedInStrip
            status={linkedin}
            prominent={false}
            onConnect={handleConnectLinkedIn}
            onDisconnect={handleDisconnectLinkedIn}
          />
        )}
      </div>

      {linkedinProminent && (
        <LinkedInStrip
          status={linkedin}
          prominent
          onConnect={handleConnectLinkedIn}
          onDisconnect={handleDisconnectLinkedIn}
        />
      )}

      <section className="flex flex-col gap-4 rounded-[var(--radius-token-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-token-sm)] sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Generate a post
            {selectedBusiness ? (
              <span className="font-normal text-[var(--muted)]"> for {selectedBusiness.name}</span>
            ) : null}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            One AI-generated image + caption, publishable to every platform you select below.
            Can take up to 2 minutes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-[var(--radius-token-md)] border border-[var(--border)]">
            {ALL_PLATFORMS.map((p) => {
              const active = activeGenTargets.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => toggleGenTarget(p)}
                  aria-pressed={active}
                  title={`Include ${PLATFORM_META[p].label} in this generation`}
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
          <button
            onClick={handleGenerate}
            disabled={generating || !selectedSlug}
            className="whitespace-nowrap rounded-[var(--radius-token-md)] bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] shadow-[var(--shadow-token-sm)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate Now"}
          </button>
        </div>
      </section>

      {generating && (
        <div className="animate-fade-in flex items-center gap-3 rounded-[var(--radius-token-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-token-sm)]">
          <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
          <p className="text-sm text-[var(--foreground)]">
            {currentStage?.label}{" "}
            <span className="text-[var(--subtle)]">({elapsed}s elapsed)</span>
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

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--muted)]">
            {postsLoading
              ? "Loading posts..."
              : `${filteredPosts.length} post${filteredPosts.length === 1 ? "" : "s"}${
                  platform !== "all" ? ` · ${PLATFORM_META[platform as PostPlatform]?.label ?? platform}` : ""
                }`}
          </h2>
        </div>

        {postsLoading && <PostListSkeleton />}

        {!postsLoading && filteredPosts.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-[var(--radius-token-lg)] border border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-6 py-14 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 9h18M8 13h4" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold">No posts yet</h3>
            <p className="max-w-xs text-sm text-[var(--muted)]">
              {platform === "all"
                ? `No posts for ${selectedBusiness?.name ?? "this business"} yet. Generate your first one above.`
                : `No ${PLATFORM_META[platform as PostPlatform]?.label ?? platform} posts yet. Try generating one, or switch platforms.`}
            </p>
          </div>
        )}

        {!postsLoading &&
          filteredPosts.map((post) => (
            <article
              key={post.id}
              className="animate-fade-in overflow-hidden rounded-[var(--radius-token-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-token-sm)]"
            >
              <div className="flex flex-col sm:flex-row">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl(post.imageUrl)}
                  alt={post.imagePrompt}
                  className="h-64 w-full shrink-0 object-cover sm:h-auto sm:w-64"
                />
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <div className="mb-2.5 flex flex-wrap items-center gap-2">
                      {post.publications.map((pub) => (
                        <span key={pub.id} className="inline-flex items-center gap-1">
                          <PlatformBadge platform={pub.platform} />
                          <StatusBadge status={pub.status} />
                        </span>
                      ))}
                      <span className="text-xs text-[var(--subtle)]">
                        {new Date(post.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {editingId === post.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editCaption}
                          onChange={(e) => setEditCaption(e.target.value)}
                          rows={5}
                          className="w-full rounded-[var(--radius-token-sm)] border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-sm focus-visible:border-[var(--accent)]"
                        />
                        <input
                          value={editHashtags}
                          onChange={(e) => setEditHashtags(e.target.value)}
                          className="w-full rounded-[var(--radius-token-sm)] border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-sm text-[var(--accent)] focus-visible:border-[var(--accent)]"
                        />
                      </div>
                    ) : (
                      <>
                        <p className="whitespace-pre-wrap text-sm text-[var(--foreground)]">
                          {post.caption}
                        </p>
                        {post.hashtags && (
                          <p className="mt-2 text-sm text-[var(--accent)]">{post.hashtags}</p>
                        )}
                      </>
                    )}

                    {post.publications
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
                    {editingId === post.id ? (
                      <>
                        <button
                          onClick={() => saveEdit(post.id)}
                          className="rounded-[var(--radius-token-sm)] bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)]"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded-[var(--radius-token-sm)] border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--accent-soft)]"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {post.publications.map((pub) => {
                          if (pub.status === "published") return null;
                          const key = `${post.id}:${pub.platform}`;
                          return (
                            <button
                              key={pub.id}
                              onClick={() => handlePublish(post.id, pub.platform)}
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
                        {ALL_PLATFORMS.filter(
                          (p) => !post.publications.some((pub) => pub.platform === p),
                        ).map((p) => {
                          const key = `${post.id}:${p}`;
                          return (
                            <button
                              key={p}
                              onClick={() => handlePublish(post.id, p)}
                              disabled={publishingKey === key}
                              className="inline-flex items-center gap-1.5 rounded-[var(--radius-token-sm)] border px-3 py-1.5 text-sm font-medium transition hover:bg-[var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-50"
                              style={{ borderColor: PLATFORM_META[p].color, color: PLATFORM_META[p].color }}
                            >
                              {publishingKey === key ? (
                                <>
                                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-current/40 border-t-current" />
                                  Publishing...
                                </>
                              ) : (
                                `Also publish to ${PLATFORM_META[p].label}`
                              )}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => startEdit(post)}
                          className="rounded-[var(--radius-token-sm)] border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--accent-soft)]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          disabled={deletingId === post.id}
                          className="rounded-[var(--radius-token-sm)] border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--danger)] transition hover:bg-[var(--danger-soft)] disabled:opacity-50"
                        >
                          {deletingId === post.id ? "Deleting..." : "Delete"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
      </section>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-9 w-40 animate-pulse rounded-[var(--radius-token-md)] bg-[var(--border)]" />
        <div className="h-9 w-64 animate-pulse rounded-[var(--radius-token-md)] bg-[var(--border)]" />
      </div>
      <div className="h-28 animate-pulse rounded-[var(--radius-token-lg)] bg-[var(--surface)] border border-[var(--border)]" />
      <PostListSkeleton />
    </div>
  );
}

function PostListSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-[var(--radius-token-lg)] border border-[var(--border)] bg-[var(--surface)] sm:flex-row"
        >
          <div className="h-64 w-full animate-pulse bg-[var(--border)] sm:h-56 sm:w-64" />
          <div className="flex flex-1 flex-col gap-3 p-4">
            <div className="h-4 w-20 animate-pulse rounded bg-[var(--border)]" />
            <div className="h-3 w-full animate-pulse rounded bg-[var(--border)]" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-[var(--border)]" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-[var(--border)]" />
          </div>
        </div>
      ))}
    </div>
  );
}
