"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, imageUrl, LinkedInStatus, Post } from "@/lib/api";

const GENERATION_STAGES = [
  { afterSeconds: 0, label: "Writing your caption and image idea..." },
  { afterSeconds: 20, label: "Creating your marketing image..." },
  { afterSeconds: 60, label: "Still creating your image, almost there..." },
];

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [linkedin, setLinkedin] = useState<LinkedInStatus>({
    connected: false,
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editHashtags, setEditHashtags] = useState("");
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    const [postList, status] = await Promise.all([
      api.listPosts(),
      api.linkedinStatus(),
    ]);
    setPosts(postList);
    setLinkedin(status);
  }, []);

  useEffect(() => {
    refresh()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setElapsed(0);
    setError(null);
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    try {
      await api.generatePost();
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate post.",
      );
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
      setGenerating(false);
    }
  }

  async function handlePublish(id: number) {
    setPublishingId(id);
    setError(null);
    try {
      await api.publishPost(id);
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to publish post.",
      );
    } finally {
      setPublishingId(null);
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.deletePost(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete post.");
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
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes.");
    }
  }

  async function handleConnectLinkedIn() {
    try {
      const { url } = await api.linkedinAuthUrl();
      window.location.href = url;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start LinkedIn connect.",
      );
    }
  }

  async function handleDisconnectLinkedIn() {
    await api.linkedinDisconnect();
    await refresh();
  }

  if (loading) {
    return <p className="text-gray-500">Loading...</p>;
  }

  const currentStage = [...GENERATION_STAGES]
    .reverse()
    .find((s) => elapsed >= s.afterSeconds);

  return (
    <div className="space-y-8">
      <section className="flex items-center justify-between rounded-lg border bg-white p-4">
        <div>
          <h2 className="font-medium">LinkedIn</h2>
          <p className="text-sm text-gray-600">
            {linkedin.connected
              ? `Connected as ${linkedin.name ?? "your account"}`
              : "Not connected. Connect your account to publish posts."}
          </p>
        </div>
        {linkedin.connected ? (
          <button
            onClick={handleDisconnectLinkedIn}
            className="rounded-md border px-3 py-1.5 text-sm"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={handleConnectLinkedIn}
            className="rounded-md bg-[#0a66c2] px-3 py-1.5 text-sm font-medium text-white"
          >
            Connect LinkedIn
          </button>
        )}
      </section>

      <section className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Today&apos;s Post</h1>
          <p className="text-sm text-gray-600">
            Generate an AI image + LinkedIn caption based on your business
            details. This can take up to 2 minutes.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="whitespace-nowrap rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {generating ? "Generating..." : "Generate Now"}
        </button>
      </section>

      {generating && (
        <div className="flex items-center gap-3 rounded-md border bg-white p-4">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          <p className="text-sm text-gray-700">
            {currentStage?.label} ({elapsed}s elapsed)
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <section className="space-y-6">
        {posts.length === 0 && (
          <p className="text-gray-500">
            No posts yet. Click &quot;Generate Now&quot; to create your first
            one.
          </p>
        )}
        {posts.map((post) => (
          <article
            key={post.id}
            className="overflow-hidden rounded-lg border bg-white"
          >
            <div className="flex flex-col sm:flex-row">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl(post.imageUrl)}
                alt={post.imagePrompt}
                className="h-64 w-full object-cover sm:h-auto sm:w-64"
              />
              <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <StatusBadge status={post.status} />
                    <span className="text-xs text-gray-400">
                      {new Date(post.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {editingId === post.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editCaption}
                        onChange={(e) => setEditCaption(e.target.value)}
                        rows={5}
                        className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                      />
                      <input
                        value={editHashtags}
                        onChange={(e) => setEditHashtags(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-blue-700"
                      />
                    </div>
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap text-sm text-gray-800">
                        {post.caption}
                      </p>
                      {post.hashtags && (
                        <p className="mt-2 text-sm text-blue-700">
                          {post.hashtags}
                        </p>
                      )}
                    </>
                  )}

                  {post.status === "failed" && post.errorMessage && (
                    <p className="mt-2 text-xs text-red-600">
                      {post.errorMessage}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {editingId === post.id ? (
                    <>
                      <button
                        onClick={() => saveEdit(post.id)}
                        className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-md border px-3 py-1.5 text-sm text-gray-700"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      {post.status !== "published" && (
                        <>
                          <button
                            onClick={() => handlePublish(post.id)}
                            disabled={publishingId === post.id}
                            className="rounded-md bg-[#0a66c2] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                          >
                            {publishingId === post.id
                              ? "Publishing..."
                              : "Publish to LinkedIn"}
                          </button>
                          <button
                            onClick={() => startEdit(post)}
                            className="rounded-md border px-3 py-1.5 text-sm text-gray-700"
                          >
                            Edit
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="rounded-md border px-3 py-1.5 text-sm text-gray-700"
                      >
                        Delete
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

function StatusBadge({ status }: { status: Post["status"] }) {
  const styles: Record<Post["status"], string> = {
    draft: "bg-gray-100 text-gray-700",
    published: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}
