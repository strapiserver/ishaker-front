import type {
  MachineReadiness,
  MachineReadinessVerdict,
} from "../../types/strapi";

export const READINESS_STALE_AFTER_MS = 3 * 60 * 60 * 1000;

export const readinessVerdictMeta: Record<
  MachineReadinessVerdict,
  { label: string; description: string; colorScheme: string }
> = {
  SHIP: {
    label: "Ready to ship",
    description: "The shipping gate passed.",
    colorScheme: "green",
  },
  REVIEW: {
    label: "Review before shipping",
    description: "The gate passed with warnings that need review.",
    colorScheme: "yellow",
  },
  DO_NOT_SHIP: {
    label: "Do not ship",
    description: "One or more required checks failed.",
    colorScheme: "red",
  },
};

export const isReadinessVerdict = (
  value: unknown,
): value is MachineReadinessVerdict =>
  value === "SHIP" || value === "REVIEW" || value === "DO_NOT_SHIP";

export const isReadinessStale = (
  readiness?: MachineReadiness | null,
  now = Date.now(),
) => {
  if (!readiness?.at) return Boolean(readiness);
  const timestamp = Date.parse(readiness.at);
  return Number.isNaN(timestamp) || now - timestamp > READINESS_STALE_AFTER_MS;
};

export const formatReadinessAge = (
  at?: string | null,
  now = Date.now(),
) => {
  if (!at) return "Not checked";
  const timestamp = Date.parse(at);
  if (Number.isNaN(timestamp)) return "Check time unavailable";

  const minutes = Math.max(0, Math.floor((now - timestamp) / 60_000));
  if (minutes < 1) return "Checked just now";
  if (minutes < 60) return `Checked ${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) {
    return `Checked ${hours}h${remainingMinutes ? ` ${remainingMinutes}m` : ""} ago`;
  }

  const days = Math.floor(hours / 24);
  return `Checked ${days}d ago`;
};

export const formatReadinessTimestamp = (at?: string | null) => {
  if (!at) return "No check has been recorded";
  const timestamp = Date.parse(at);
  if (Number.isNaN(timestamp)) return "Check time unavailable";

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(timestamp);
};
