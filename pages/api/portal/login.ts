import type { NextApiRequest, NextApiResponse } from "next";
import { getStrapiBaseUrl } from "../../../services/fetchers";
import {
  isProductClientUser,
  setPortalSession,
} from "../../../lib/portal/auth";
import { requestStrapiRestAsService } from "../../../services/server/strapiClient";
import type { Client } from "../../../types/strapi";
import type { PortalUser } from "../../../types/portal";
import {
  createAdminImpersonationToken,
  isAdminPasswordConfigured,
  verifyAdminPassword,
} from "../../../lib/admin/auth";

const findPortalUser = async (identifier: string) => {
  const params = new URLSearchParams();
  params.set("filters[$or][0][email][$eqi]", identifier);
  params.set("filters[$or][1][username][$eqi]", identifier);
  params.set("populate[0]", "client");
  params.set("populate[1]", "role");
  params.set("pagination[pageSize]", "2");

  const users = await requestStrapiRestAsService<PortalUser[]>(
    `/api/users?${params.toString()}`,
  );
  return users.find(
    (user) =>
      user.email?.toLowerCase() === identifier ||
      user.username?.toLowerCase() === identifier,
  );
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const identifier =
    typeof req.body?.identifier === "string"
      ? req.body.identifier.trim().toLowerCase()
      : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!identifier || !password) {
    return res.status(400).json({ error: "identifier_and_password_required" });
  }

  let authIdentifier = identifier;
  if (!identifier.includes("@")) {
    const params = new URLSearchParams();
    params.set("filters[company][$eqi]", identifier);
    params.set("fields[0]", "portal_email");
    params.set("pagination[pageSize]", "1");
    const clients = await requestStrapiRestAsService<Client[]>(
      `/api/clients?${params.toString()}`,
    ).catch(() => []);
    authIdentifier = clients[0]?.portal_email?.toLowerCase() || identifier;
  }

  try {
    if (isAdminPasswordConfigured() && verifyAdminPassword(password)) {
      const user = await findPortalUser(authIdentifier);
      if (!user?.id || (!user.client?.id && !isProductClientUser(user))) {
        return res.status(404).json({ error: "portal_user_not_found" });
      }

      setPortalSession(res, createAdminImpersonationToken(user.id));
      console.info("[portal/login] admin impersonation started", {
        userId: user.id,
      });
      return res.status(200).json({ ok: true, impersonating: true });
    }
  } catch (error) {
    console.error("[portal/login] admin impersonation failed:", error);
    return res.status(500).json({ error: "admin_auth_unavailable" });
  }

  const response = await fetch(`${getStrapiBaseUrl()}/api/auth/local`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ identifier: authIdentifier, password }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.jwt) {
    return res.status(401).json({ error: "invalid_credentials" });
  }

  setPortalSession(res, payload.jwt);
  return res.status(200).json({ ok: true });
}
