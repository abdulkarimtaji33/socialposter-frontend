"use client";

import { useEffect, useState } from "react";
import { api, BusinessProfile } from "@/lib/api";

const emptyForm = {
  name: "",
  industry: "",
  description: "",
  targetAudience: "",
  tone: "",
  website: "",
  location: "",
  uniqueSellingPoints: "",
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
            industry: profile.industry ?? "",
            description: profile.description ?? "",
            targetAudience: profile.targetAudience ?? "",
            tone: profile.tone ?? "",
            website: profile.website ?? "",
            location: profile.location ?? "",
            uniqueSellingPoints: profile.uniqueSellingPoints ?? "",
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
        <Field label="Business name" required>
          <input
            required
            className="input"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </Field>

        <Field label="Industry">
          <input
            className="input"
            value={form.industry}
            onChange={(e) => update("industry", e.target.value)}
          />
        </Field>

        <Field label="What does your business do?" required>
          <textarea
            required
            rows={4}
            className="input"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </Field>

        <Field label="Target audience">
          <input
            className="input"
            value={form.targetAudience}
            onChange={(e) => update("targetAudience", e.target.value)}
          />
        </Field>

        <Field label="Tone of voice">
          <input
            className="input"
            placeholder="e.g. professional, friendly, bold"
            value={form.tone}
            onChange={(e) => update("tone", e.target.value)}
          />
        </Field>

        <Field label="Unique selling points">
          <textarea
            rows={3}
            className="input"
            value={form.uniqueSellingPoints}
            onChange={(e) => update("uniqueSellingPoints", e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Website">
            <input
              className="input"
              value={form.website}
              onChange={(e) => update("website", e.target.value)}
            />
          </Field>
          <Field label="Location">
            <input
              className="input"
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
            />
          </Field>
        </div>

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

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}
