import type { NextApiRequest, NextApiResponse } from "next";
import { getStrapiBaseUrl } from "../../../services/fetchers";
import { setPortalSession } from "../../../lib/portal/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const identifier =
    typeof req.body?.identifier === "string" ? req.body.identifier.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!identifier || !password) {
    return res.status(400).json({ error: "identifier_and_password_required" });
  }

  const response = await fetch(`${getStrapiBaseUrl()}/api/auth/local`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.jwt) {
    return res.status(401).json({ error: "invalid_credentials" });
  }

  setPortalSession(res, payload.jwt);
  return res.status(200).json({ ok: true });
}
