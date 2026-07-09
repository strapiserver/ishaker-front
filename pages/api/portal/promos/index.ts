import type { NextApiRequest, NextApiResponse } from "next";
import {
  assertMachineBelongsToSessionClient,
  getPortalSessionFromApiRequest,
} from "../../../../lib/portal/auth";
import { requestStrapiRestAsService } from "../../../../services/server/strapiClient";

const asString = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const getErrorPayload = (error: unknown) => {
  const apiError = error as {
    status?: number;
    response?: {
      error?: {
        message?: string;
        details?: unknown;
        name?: string;
      };
    };
    message?: string;
  };

  return {
    status: apiError.status || 500,
    message:
      apiError.response?.error?.message ||
      apiError.response?.error?.name ||
      apiError.message ||
      "Promo creation failed.",
    details: apiError.response?.error?.details || null,
  };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getPortalSessionFromApiRequest(req);

  if (!session) {
    return res.status(401).json({ error: "unauthorized" });
  }

  if (req.method === "POST") {
    const code = asString(req.body?.code);
    const discountType = asString(req.body?.discountType) as "PERCENT" | "FIXED";
    const amount = Number(req.body?.amount);
    const startAt = asString(req.body?.startAt);
    const endAt = asString(req.body?.endAt);
    const machineIdRaw = req.body?.machineId;

    if (!code || !discountType || !Number.isFinite(amount) || !startAt || !endAt) {
      return res.status(400).json({ error: "missing_required_fields" });
    }

    const machineId =
      typeof machineIdRaw === "string" || typeof machineIdRaw === "number"
        ? machineIdRaw
        : null;

    if (machineId) {
      const machine = await assertMachineBelongsToSessionClient(session, machineId);
      if (!machine) {
        return res.status(403).json({ error: "machine_access_denied" });
      }
    }

    try {
      const response = await requestStrapiRestAsService("/api/promo-codes", {
        method: "POST",
        body: JSON.stringify({
          data: {
            title: asString(req.body?.title),
            code,
            discount_type: discountType,
            amount,
            start_at: startAt,
            end_at: endAt,
            notes: asString(req.body?.notes),
            status: "draft",
            client: session.client.id,
            ...(machineId ? { machine: machineId } : {}),
          },
        }),
      });

      return res.status(200).json({ ok: true, promo: response });
    } catch (error) {
      console.error("[portal/promos] create failed:", error);
      const payload = getErrorPayload(error);
      return res.status(payload.status).json({
        error: "promo_creation_failed",
        message: payload.message,
        details: payload.details,
      });
    }
  }

  res.setHeader("Allow", ["POST"]);
  return res.status(405).json({ error: "method_not_allowed" });
}
