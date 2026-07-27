import type { NextApiRequest, NextApiResponse } from "next";
import {
  assertMachineBelongsToSessionClient,
  getPortalSessionFromApiRequest,
} from "../../../../../lib/portal/auth";
import { requestStrapiRestAsService } from "../../../../../services/server/strapiClient";
import type { PortalProductLine } from "../../../../../types/portal";
import type { Currency } from "../../../../../types/strapi";

const idFrom = (value: unknown) => {
  const raw = Array.isArray(value) ? value[0] : value;
  const id = typeof raw === "string" ? raw.trim() : "";
  return /^\d+$/.test(id) ? id : "";
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

  const productLineId = idFrom(req.query.id);
  const currencyId = idFrom(req.body?.currencyId);
  if (!productLineId || !currencyId) {
    return res.status(400).json({ error: "invalid_currency_selection" });
  }

  try {
    const params = new URLSearchParams();
    params.set("filters[id][$eq]", productLineId);
    params.set(
      "filters[author][client][id][$eq]",
      String(session.client.id),
    );
    params.set("populate[machines][fields][0]", "id");
    params.set("pagination[pageSize]", "1");
    const [productLines, currency] = await Promise.all([
      requestStrapiRestAsService<PortalProductLine[]>(
        `/api/product-lines?${params.toString()}`,
      ),
      requestStrapiRestAsService<Currency>(
        `/api/currencies/${currencyId}`,
      ).catch(() => null),
    ]);
    const productLine = productLines[0];
    if (!productLine) {
      return res.status(403).json({ error: "product_line_access_denied" });
    }
    if (!currency?.id || currency.isActive === false) {
      return res.status(400).json({
        error: "invalid_currency",
        message: "Select an active currency.",
      });
    }

    const machines = productLine.machines || [];
    if (!machines.length) {
      return res.status(409).json({
        error: "product_line_has_no_machines",
        message: "Assign this product line to a machine before setting currency.",
      });
    }
    const ownedMachines = await Promise.all(
      machines.map((machine) =>
        assertMachineBelongsToSessionClient(session, machine.id),
      ),
    );
    if (ownedMachines.some((machine) => !machine)) {
      return res.status(403).json({ error: "machine_access_denied" });
    }

    await Promise.all(
      machines.map((machine) =>
        requestStrapiRestAsService(`/api/machines/${machine.id}`, {
          method: "PUT",
          body: JSON.stringify({ data: { currency: currency.id } }),
        }),
      ),
    );
    return res.status(200).json({
      currency,
      updatedMachineIds: machines.map((machine) => machine.id),
    });
  } catch (error) {
    console.error("[portal/product-lines/:id/machine-currency] update failed:", error);
    return res.status(500).json({
      error: "machine_currency_update_failed",
      message: "Machine currency could not be updated.",
    });
  }
}
