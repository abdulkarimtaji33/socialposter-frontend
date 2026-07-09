"use client";

import { useEffect, useState } from "react";
import { api, BusinessProfile } from "@/lib/api";

const emptyForm = {
  name: "",
  description: "",
  products: "",
  autoPublish: false,
};

export default function BusinessPage() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getBusiness()
      .then((profile: BusinessProfile | null) => {
        if (profile) {
          setForm({
            name: profile.name ?? "",
            description: profile.description ?? "",
            products: profile.products ?? "",
            autoPublish: profile.autoPublish ?? false,
          });
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await api.saveBusiness(form);
      setMessage("Business details saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  function update<K extends keyof typeof emptyForm>(
    key: K,
    value: (typeof emptyForm)[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) {
    return <p className="text-gray-500">Loading...</p>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-2xl font-semibold">Business Details</h1>
      <p className="mb-6 text-sm text-gray-600">
        Tell us about your business. This is used to generate your daily
        LinkedIn image post and caption.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            Business name <span className="text-red-500">*</span>
          </span>
          <input
            required
            className="input"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            About your business <span className="text-red-500">*</span>
          </span>
          <textarea
            required
            rows={10}
            className="input"
            placeholder="What does your business do, who it's for, your tone of voice, unique selling points, website, location — anything that should shape your marketing posts."
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            Products / tools to occasionally spotlight (optional)
          </span>
          <textarea
            rows={4}
            className="input"
            placeholder={
              "One per line, e.g.:\nAI Business Plan Generator (https://cybollic.com/ai-business-plan-generator.html) — free tool that generates a 21-section investor-ready business plan in under 2 minutes"
            }
            value={form.products}
            onChange={(e) => update("products", e.target.value)}
          />
          <span className="mt-1 block text-xs text-gray-500">
            Every generated post has a small random chance of promoting one
            of these specific products instead of the business in general.
          </span>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.autoPublish}
            onChange={(e) => update("autoPublish", e.target.checked)}
          />
          Automatically publish the daily generated post to LinkedIn
        </label>

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Business Details"}
        </button>

        {message && <p className="text-sm text-green-600">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
        .input:focus {
          outline: 2px solid #111827;
          outline-offset: 1px;
        }
      `}</style>
    </div>
  );
}
