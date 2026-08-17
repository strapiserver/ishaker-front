import { createHash } from "node:crypto";
import type { NextApiRequest } from "next";
import { requestStrapiRestAsService } from "../../services/server/strapiClient";
import type { Machine } from "../../types/strapi";

type IssuedVia = "portal" | "admin";

type RateLimitEntry = { timestamps: number[] };
const rateLimits = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

export const consumeDoorKeyRateLimit = (key: string, now = Date.now()) => {
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (rateLimits.get(key)?.timestamps ?? []).filter(
    (timestamp) => timestamp > cutoff,
  );
  if (timestamps.length >= RATE_LIMIT_MAX) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((timestamps[0] + RATE_LIMIT_WINDOW_MS - now) / 1000)),
    };
  }
  timestamps.push(now);
  rateLimits.set(key, { timestamps });
  return { allowed: true, retryAfterSeconds: 0 };
};

export const resolveDoorSerial = (machine: Machine) => {
  const recordSerial = String(machine.serial_number || "");
  const deviceSerial = String(machine.fleet_status?.device_serial || "");
  const serial = deviceSerial || recordSerial;

  return {
    serial,
    serialSource: deviceSerial ? ("device" as const) : ("record" as const),
    serialMismatch: Boolean(deviceSerial && deviceSerial !== recordSerial),
  };
};

const requestIp = (req: NextApiRequest) => {
  const forwarded = req.headers["x-forwarded-for"];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return value?.split(",")[0]?.trim() || req.socket.remoteAddress || null;
};

export const logDoorAccess = async ({
  req,
  machine,
  serial,
  payload,
  issuedVia,
  issuedAt,
  validUntil,
  issuedTo,
  issuedToLabel,
}: {
  req: NextApiRequest;
  machine: Machine;
  serial: string;
  payload: string;
  issuedVia: IssuedVia;
  issuedAt: string;
  validUntil: string;
  issuedTo?: string | number | null;
  issuedToLabel: string;
}) => {
  const data: Record<string, unknown> = {
    machine: machine.id,
    serial,
    mode: "oneday",
    issued_via: issuedVia,
    issued_at: issuedAt,
    valid_until: validUntil,
    issued_to_label: issuedToLabel,
    fingerprint: createHash("sha256").update(payload).digest("hex").slice(0, 12),
    ip: requestIp(req),
    user_agent: req.headers["user-agent"] || null,
  };
  if (issuedTo !== null && issuedTo !== undefined) data.issued_to = issuedTo;

  try {
    await requestStrapiRestAsService("/api/door-accesses", {
      method: "POST",
      body: JSON.stringify({ data }),
    });
  } catch (error) {
    console.warn("[door-access] audit log write failed:", error);
  }
};
