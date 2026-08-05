import type { Machine } from "../../types/strapi";
import type {
  MachineHealthIndicator,
  MachineHealthRow,
  TelemetryHealthInput,
} from "../../types/machineHealth";

const STALE_AFTER_MS = 10 * 60 * 1000;

const unknown = (label = "No data"): MachineHealthIndicator => ({
  state: "unknown",
  label,
  source: "none",
  at: null,
});

const isStale = (at?: string | null, now = Date.now()) => {
  if (!at) return true;
  const timestamp = Date.parse(at);
  return Number.isNaN(timestamp) || now - timestamp > STALE_AFTER_MS;
};

const finiteNumber = (value: unknown): number | null => {
  const number = Number(value);
  return value === null || value === "" || !Number.isFinite(number)
    ? null
    : number;
};

const liters = (milliliters: number) => {
  const value = milliliters / 1000;
  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} L`;
};

const ownHealth = (machine: Machine, now: number): MachineHealthRow | null => {
  const health = machine.health;
  if (!health) return null;

  const stale = isStale(health.at, now);
  const online: MachineHealthIndicator = stale
    ? { state: "unknown", label: "Stale", source: "own", at: health.at }
    : health.app?.frames_ok === true
      ? { state: "ok", label: "Online", source: "own", at: health.at }
      : health.app?.frames_ok === false
        ? { state: "error", label: "App error", source: "own", at: health.at }
        : { state: "unknown", label: "No data", source: "own", at: health.at };

  const terminalAt = health.terminal?.at || health.at;
  const terminalStale = isStale(terminalAt, now);
  const terminal: MachineHealthIndicator = terminalStale
    ? { state: "unknown", label: "Stale", source: "own", at: terminalAt }
    : health.terminal?.card === true
      ? {
          state: "ok",
          label: "Available",
          source: "own",
          at: terminalAt,
        }
      : health.terminal?.card === false
        ? {
            state: "error",
            label: "Unavailable",
            source: "own",
            at: terminalAt,
          }
        : { state: "unknown", label: "No data", source: "own", at: health.at };

  const waterCurrent = finiteNumber(health.water?.current);
  const waterMax = finiteNumber(health.water?.max);
  const waterLabel =
    waterCurrent !== null
      ? waterMax !== null
        ? `${liters(waterCurrent)} / ${liters(waterMax)}`
        : liters(waterCurrent)
      : "No data";
  const water: MachineHealthIndicator = stale
    ? { state: "unknown", label: "Stale", source: "own", at: health.at }
    : {
        state:
          waterCurrent === null
            ? "unknown"
            : health.water?.low
              ? "error"
              : "ok",
        label: waterLabel,
        source: "own",
        at: health.at,
      };

  const containers = health.containers || [];
  const lowContainers = containers.filter((container) => container.runs_out);
  const powders: MachineHealthIndicator = stale
    ? { state: "unknown", label: "Stale", source: "own", at: health.at }
    : !containers.length
      ? { state: "unknown", label: "No data", source: "own", at: health.at }
      : {
          state: lowContainers.length ? "error" : "ok",
          label: lowContainers.length
            ? `${lowContainers.length} low`
            : `${containers.length} OK`,
          source: "own",
          at: health.at,
        };

  const cupErrorCodes = new Set([20, 126, 135, 600, 601, 602]);
  const hasCupError = (health.errors || []).some(
    (error) => error.code != null && cupErrorCodes.has(error.code),
  );
  const cupCount = finiteNumber(health.cups?.current);
  const cups =
    health.cups?.tracked === false
      ? null
      : stale
        ? {
            state: "unknown" as const,
            label: "Stale",
            source: "own" as const,
            at: health.at,
          }
        : health.cups
          ? {
              state:
                health.cups.low || hasCupError
                  ? ("error" as const)
                  : ("ok" as const),
              label:
                cupCount === null
                  ? "No data"
                  : hasCupError
                    ? `${cupCount} · error`
                    : `${cupCount} left`,
              source: "own" as const,
              at: health.at,
            }
          : unknown();

  return {
    id: machine.id,
    nickname: machine.nickname,
    serial_number: machine.serial_number,
    online,
    terminal,
    water,
    powders,
    cups,
  };
};

const telemetryIndicators = (telemetry?: TelemetryHealthInput | null) => {
  const connectionStatus = String(
    telemetry?.status?.connectionStatus || "",
  ).toUpperCase();
  const online: MachineHealthIndicator =
    connectionStatus === "ONLINE"
      ? { state: "ok", label: "Online", source: "telemetry" }
      : connectionStatus === "OFFLINE"
        ? { state: "error", label: "Offline", source: "telemetry" }
        : unknown();

  const storage = telemetry?.storage || {};
  const waters = Array.isArray(storage.cellWaters) ? storage.cellWaters : [];
  const waterCurrent = waters.reduce(
    (sum: number, cell: any) => sum + (finiteNumber(cell?.volume) || 0),
    0,
  );
  const waterMax = waters.reduce(
    (sum: number, cell: any) => sum + (finiteNumber(cell?.maxVolume) || 0),
    0,
  );
  const waterLow = waters.some((cell: any) => {
    const volume = finiteNumber(cell?.volume);
    const minimum = finiteNumber(cell?.minVolume);
    return volume !== null && minimum !== null && volume <= minimum;
  });
  const water: MachineHealthIndicator = waters.length
    ? {
        state: waterLow ? "error" : "ok",
        label: waterMax
          ? `${liters(waterCurrent)} / ${liters(waterMax)}`
          : liters(waterCurrent),
        source: "telemetry",
      }
    : unknown();

  const cells = Array.isArray(storage.cells) ? storage.cells : [];
  const lowCells = cells.filter((cell: any) => {
    const volume = finiteNumber(cell?.volume);
    const minimum = finiteNumber(cell?.minVolume);
    return volume !== null && minimum !== null && volume <= minimum;
  });
  const powders: MachineHealthIndicator = cells.length
    ? {
        state: lowCells.length ? "error" : "ok",
        label: lowCells.length ? `${lowCells.length} low` : `${cells.length} OK`,
        source: "telemetry",
      }
    : unknown();

  const cupCells = Array.isArray(storage.cellCups) ? storage.cellCups : [];
  const cupCount = cupCells.reduce(
    (sum: number, cell: any) => sum + (finiteNumber(cell?.volume) || 0),
    0,
  );
  const cups: MachineHealthIndicator = cupCells.length
    ? {
        state: cupCount > 0 ? "ok" : "error",
        label: `${cupCount} left`,
        source: "telemetry",
      }
    : unknown();

  return { online, water, powders, cups };
};

export const buildMachineHealthRow = (
  machine: Machine,
  telemetry?: TelemetryHealthInput | null,
  now = Date.now(),
): MachineHealthRow => {
  const own = ownHealth(machine, now);
  if (own) return own;

  const fallback = telemetryIndicators(telemetry);
  const fleet = machine.fleet_status as Record<string, unknown> | null | undefined;
  const fleetAt = typeof fleet?.at === "string" ? fleet.at : null;
  const fleetFresh = Boolean(fleetAt && !isStale(fleetAt, now));
  const fleetHealthy = fleet?.sweep === "ok" && fleet?.ssh_ok === true;
  const online: MachineHealthIndicator = fleetAt
    ? fleetFresh
      ? {
          state: fleetHealthy ? "ok" : "error",
          label: fleetHealthy ? "Online" : "Offline",
          source: "ops",
          at: fleetAt,
        }
      : { state: "unknown", label: "Stale", source: "ops", at: fleetAt }
    : fallback.online;

  return {
    id: machine.id,
    nickname: machine.nickname,
    serial_number: machine.serial_number,
    online,
    terminal: unknown(),
    water: fallback.water,
    powders: fallback.powders,
    cups: fallback.cups,
  };
};
