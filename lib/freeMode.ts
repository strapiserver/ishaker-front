export const FREE_MODE_MAX_MINUTES = 3600;

export type FreeModeSource = "portal" | "machine" | null;

export type FreeModeState = {
  enabled: boolean;
  minutes: number;
  remainingSeconds: number | null;
  startedAt: string | null;
  rev: number;
  source: FreeModeSource;
  expired: boolean;
};

export type FreeModeWriteResponse = {
  id: string | number;
  accepted: boolean;
  reason?: "stale_rev" | string;
  detail?: string;
  state: FreeModeState;
};

type MachineFreeModeFields = {
  id?: string | number;
  free_mode?: boolean | null;
  free_mode_minutes?: number | string | null;
  free_mode_started_at?: string | null;
  free_mode_rev?: number | string | null;
  free_mode_source?: string | null;
};

export const freeModeStateFromMachine = (
  machine: MachineFreeModeFields,
  now = Date.now(),
): FreeModeState => {
  const rawMinutes = Number(machine.free_mode_minutes || 0);
  const minutes = Number.isFinite(rawMinutes)
    ? Math.max(0, Math.min(FREE_MODE_MAX_MINUTES, rawMinutes))
    : 0;
  const startedAt = machine.free_mode_started_at || null;
  const startedAtMs = startedAt ? Date.parse(startedAt) : now;
  const storedEnabled = machine.free_mode === true;
  let remainingSeconds: number | null = null;
  let expired = false;

  if (storedEnabled && minutes > 0) {
    const started = Number.isFinite(startedAtMs) ? startedAtMs : now;
    const secondsLeft = Math.round(
      (started + minutes * 60_000 - now) / 1000,
    );
    remainingSeconds = Math.max(0, secondsLeft);
    expired = secondsLeft <= 0;
  }

  const source = ["portal", "machine"].includes(
    String(machine.free_mode_source),
  )
    ? (machine.free_mode_source as Exclude<FreeModeSource, null>)
    : null;

  return {
    enabled: storedEnabled && !expired,
    minutes,
    remainingSeconds,
    startedAt,
    rev: Number(machine.free_mode_rev || 0),
    source,
    expired,
  };
};

export const parseFreeModeMinutes = (value: unknown) => {
  if (
    value !== undefined &&
    value !== null &&
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    return null;
  }
  const normalized =
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "")
      ? 0
      : Number(value);

  return Number.isInteger(normalized) &&
    normalized >= 0 &&
    normalized <= FREE_MODE_MAX_MINUTES
    ? normalized
    : null;
};
