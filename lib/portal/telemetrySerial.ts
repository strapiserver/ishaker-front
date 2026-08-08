/**
 * Serial-number matching between Strapi and the manage.ishakerusa.com cabinet.
 *
 * The two systems spell the same physical machine differently:
 *
 *   Strapi              cabinet
 *   26041830            S-26041830S
 *   25011719            S-25011719S
 *   24101321            S-24101321SS
 *   25110041            T2-25110041S
 *   260511737-r1722     260511737
 *
 * Machines registered through the portal agree exactly; the ones entered by
 * hand in the cabinet before the portal existed do not.
 *
 * Normalising is not enough on its own: several distinct machines collapse onto
 * the same normalised key (org 2 holds 260511736-r080b, -re947 and -r66ec, and
 * both 004-r5b6c and 004-r8e52). Matching on the normalised key alone would
 * therefore attach one machine's water level to another machine's card. So an
 * exact match always wins, and a normalised match is only accepted when it is
 * unambiguous.
 *
 * Note this is deliberately separate from getMachineSerialBase() in
 * ./machineSerial, which answers a different question (Strapi-side clone
 * grouping during registration) and must keep its current behaviour.
 */

const CLONE_SUFFIX = /-R[0-9A-F]{4,}$/;
const MODEL_PREFIX = /^(?:T2|MS|S|T)-/;
const TRAILING_S = /S+$/;

/** Reduce either spelling to a comparable core, e.g. "S-26041830S" -> "26041830". */
export const normalizeTelemetrySerial = (raw?: string | null) => {
  const trimmed = String(raw || "").trim().toUpperCase();
  if (!trimmed) return "";

  return trimmed
    .replace(CLONE_SUFFIX, "")
    .replace(MODEL_PREFIX, "")
    .replace(TRAILING_S, "");
};

export type TelemetrySerialMatchReason =
  | "exact"
  | "normalized"
  | "not_found"
  | "ambiguous"
  | "missing_serial";

export type TelemetrySerialMatch<T> = {
  machine: T | null;
  reason: TelemetrySerialMatchReason;
  /** Populated only when reason is "ambiguous", for logging. */
  candidates?: string[];
};

/**
 * Find the cabinet machine that corresponds to a Strapi serial number.
 * Never guesses: an ambiguous normalised key returns no machine.
 */
export const matchTelemetryMachineBySerial = <
  T extends { serialNumber?: string },
>(
  telemetryMachines: T[],
  strapiSerial?: string | null,
): TelemetrySerialMatch<T> => {
  const raw = String(strapiSerial || "").trim();
  if (!raw) return { machine: null, reason: "missing_serial" };

  const exact = telemetryMachines.find(
    (machine) => String(machine.serialNumber || "").trim() === raw,
  );
  if (exact) return { machine: exact, reason: "exact" };

  const key = normalizeTelemetrySerial(raw);
  if (!key) return { machine: null, reason: "not_found" };

  const candidates = telemetryMachines.filter(
    (machine) => normalizeTelemetrySerial(machine.serialNumber) === key,
  );

  if (candidates.length === 1) {
    return { machine: candidates[0], reason: "normalized" };
  }

  if (candidates.length > 1) {
    return {
      machine: null,
      reason: "ambiguous",
      candidates: candidates.map((machine) =>
        String(machine.serialNumber || ""),
      ),
    };
  }

  return { machine: null, reason: "not_found" };
};
