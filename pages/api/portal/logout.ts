import type { NextApiRequest, NextApiResponse } from "next";
import { clearPortalSession } from "../../../lib/portal/auth";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "method_not_allowed" });
  }

  clearPortalSession(res);
  return res.status(200).json({ ok: true });
}
