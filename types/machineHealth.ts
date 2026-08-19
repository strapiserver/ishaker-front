export type HealthSource = "own" | "ops" | "telemetry" | "none";

export type HealthState = "ok" | "warning" | "error" | "unknown";

export type MachineHealthIndicator = {
  state: HealthState;
  label: string;
  source: HealthSource;
  at?: string | null;
  lastOnlineAt?: string | null;
};

export type MachineHealthRow = {
  id: string | number;
  nickname?: string | null;
  serial_number: string;
  online: MachineHealthIndicator;
  terminal: MachineHealthIndicator;
  water: MachineHealthIndicator;
  powders: MachineHealthIndicator;
  cups: MachineHealthIndicator | null;
};

export type TelemetryHealthInput = {
  status?: any | null;
  storage?: any | null;
};
