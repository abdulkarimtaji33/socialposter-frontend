"use client";

import { useCallback, useEffect, useState } from "react";
import { api, imageUrl, LinkedInStatus, Post } from "@/lib/api";

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [linkedin, setLinkedin] = useState<LinkedInStatus>({
    connected: false,
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      await api.generatePost();
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate post.",
      );
    } finally {
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
                  <p className="whitespace-pre-wrap text-sm text-gray-800">
                    {post.caption}
                  </p>
                  {post.hashtags && (
                    <p className="mt-2 text-sm text-blue-700">
                      {post.hashtags}
                    </p>
                  )}
                  {post.status === "failed" && post.errorMessage && (
                    <p className="mt-2 text-xs text-red-600">
                      {post.errorMessage}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  {post.status !== "published" && (
                    <button
                      onClick={() => handlePublish(post.id)}
                      disabled={publishingId === post.id}
                      className="rounded-md bg-[#0a66c2] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                    >
                      {publishingId === post.id
                        ? "Publishing..."
                        : "Publish to LinkedIn"}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="rounded-md border px-3 py-1.5 text-sm text-gray-700"
                  >
                    Delete
                  </button>
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
