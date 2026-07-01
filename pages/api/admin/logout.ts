import type { NextApiRequest, NextApiResponse } from "next";
import { clearAdminSession } from "../../../lib/admin/auth";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "method_not_allowed" });
  }

  clearAdminSession(res);
  return res.status(200).json({ ok: true });
}
