import type { NextApiRequest, NextApiResponse } from "next";
import { setAdminSession, verifyAdminPassword } from "../../../lib/admin/auth";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const password = typeof req.body?.password === "string" ? req.body.password : "";

  try {
    if (!verifyAdminPassword(password)) {
      return res.status(401).json({ error: "invalid_password" });
    }

    setAdminSession(res);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[admin/login] failed:", error);
    return res.status(500).json({ error: "admin_auth_unavailable" });
  }
}
