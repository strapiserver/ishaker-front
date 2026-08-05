import type { Machine } from "../../types/strapi";

const machine94Health = (): NonNullable<Machine["health"]> => {
  const now = new Date().toISOString();

  return {
    at: now,
    app: { uptime_s: 720, frames_ok: true },
    terminal: { card: true, at: now },
    water: {
      current: 14950,
      max: 19000,
      low: false,
      counter_reset_at: "2026-08-01T09:00:00Z",
    },
    cups: { current: 99, low: false, tracked: true },
    containers: [
      {
        position: 1,
        current: 1950,
        max: 2000,
        servings_left: 12,
        runs_out: false,
        product: "chocolate",
      },
    ],
    errors: [{ code: 602, at: now }],
  };
};

export const applyMachineHealthFixture = (machines: Machine[]) => {
  if (process.env.NODE_ENV === "production") return machines;

  const fixture = process.env.FLEET_HEALTH_FIXTURE;
  if (fixture !== "health" && fixture !== "none") return machines;

  return machines.map((machine) => {
    if (String(machine.id) !== "94" && machine.serial_number !== "001") {
      return machine;
    }

    if (fixture === "none") {
      return { ...machine, health: null, fleet_status: null };
    }

    return { ...machine, health: machine94Health() };
  });
};
