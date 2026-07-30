import { PublicationStatus, PostPlatform } from "@/lib/api";
import { PLATFORM_META } from "./PlatformTabs";

export function StatusBadge({ status }: { status: PublicationStatus }) {
  const styles: Record<PublicationStatus, string> = {
    draft: "bg-[var(--border)] text-[var(--muted)]",
    published: "bg-[var(--success-soft)] text-[var(--success)]",
    failed: "bg-[var(--danger-soft)] text-[var(--danger)]",
  };
  const labels: Record<PublicationStatus, string> = {
    draft: "Draft",
    published: "Published",
    failed: "Failed",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {status === "published" && (
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
      )}
      {status === "failed" && (
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--danger)]" />
      )}
      {labels[status]}
    </span>
  );
}

export function PlatformBadge({ platform }: { platform: PostPlatform }) {
  const meta = PLATFORM_META[platform];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium"
      style={{
        color: meta.color,
        borderColor: meta.color,
        backgroundColor: "color-mix(in srgb, " + meta.color + " 10%, transparent)",
      }}
    >
      {meta.icon}
      {meta.label}
    </span>
  );
}
