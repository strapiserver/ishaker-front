import type { NextApiRequest, NextApiResponse } from "next";
import { fetchPortalUser, setPortalSession } from "../../../lib/portal/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const jwt = typeof req.body?.jwt === "string" ? req.body.jwt : "";
  if (!jwt) {
    return res.status(400).json({ error: "jwt_required" });
  }

  try {
    const user = await fetchPortalUser(jwt);
    if (!user?.client?.id) {
      return res.status(403).json({
        error: "client_not_linked",
        message: "This Google account is not linked to a client account.",
      });
    }

    setPortalSession(res, jwt);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[portal/oauth-login] failed:", error);
    return res.status(401).json({ error: "oauth_login_failed" });
  }
}
