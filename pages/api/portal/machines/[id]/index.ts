import type { NextApiRequest, NextApiResponse } from "next";
import {
  assertMachineBelongsToSessionClient,
  getPortalSessionFromApiRequest,
} from "../../../../../lib/portal/auth";
import { updateMachineRegistrationData } from "../../../../../services/server/machineRegistration";
import { requestStrapiRestAsService } from "../../../../../services/server/strapiClient";
import type { Currency } from "../../../../../types/strapi";

const asString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const asId = (value: string | string[] | undefined) => {
  const id = Array.isArray(value) ? value[0] : value;
  return id && /^\d+$/.test(id) ? id : "";
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "PUT") {
    res.setHeader("Allow", ["PUT"]);
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const session = await getPortalSessionFromApiRequest(req);
  if (!session || session.access !== "client") {
    return res.status(401).json({ error: "unauthorized" });
  }

  const machineId = asId(req.query.id);
  const machine = machineId
    ? await assertMachineBelongsToSessionClient(session, machineId)
    : null;
  if (!machine) {
    return res.status(403).json({ error: "machine_access_denied" });
  }

  const country = asString(req.body?.country);
  const stateRegion = asString(req.body?.state);
  const city = asString(req.body?.city);
  const location = asString(req.body?.location);
  const currencyId = asString(req.body?.currencyId);
  const nayaxTerminalId =
    typeof req.body?.nayaxTerminalId === "string"
      ? req.body.nayaxTerminalId.trim()
      : undefined;
  if (!country || !stateRegion || !city || !currencyId) {
    return res.status(400).json({
      error: "missing_location",
      message: "Country, state/region, city, and currency are required.",
    });
  }
  if (nayaxTerminalId && nayaxTerminalId.length > 255) {
    return res.status(400).json({
      error: "invalid_nayax_terminal_id",
      message: "Nayax terminal ID must be 255 characters or fewer.",
    });
  }

  const currency = await requestStrapiRestAsService<Currency>(
    `/api/currencies/${currencyId}`,
  ).catch(() => null);
  if (!currency?.id || currency.isActive === false) {
    return res.status(400).json({
      error: "invalid_currency",
      message: "Select an active currency.",
    });
  }

  try {
    const updatedMachine = await updateMachineRegistrationData({
      client: session.client,
      machine,
      nickname: session.client.company,
      country,
      stateRegion,
      city,
      location,
      currencyId: currency.id,
      nayaxTerminalId,
    });
    return res.status(200).json({ machine: updatedMachine });
  } catch (error) {
    console.error("[portal/machines/:id] update failed:", error);
    return res.status(500).json({
      error: "machine_update_failed",
      message: "Machine registration data could not be updated.",
    });
  }
}
