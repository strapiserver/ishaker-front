import type { NextApiRequest, NextApiResponse } from "next";
import { getPortalSessionFromApiRequest } from "../../../../lib/portal/auth";
import { requestStrapiRestAsService } from "../../../../services/server/strapiClient";
import { capitalizeName } from "../../../../lib/formatName";
import type {
  PortalBrand,
  PortalCup,
  PortalProductLine,
  PortalSplash,
} from "../../../../types/portal";

const asString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const asId = (value: unknown) => {
  const id = asString(value);
  return /^\d+$/.test(id) ? id : "";
};

const asIds = (value: unknown) =>
  Array.isArray(value)
    ? [...new Set(value.map(asId).filter(Boolean))]
    : [];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const session = await getPortalSessionFromApiRequest(req);
  if (!session) return res.status(401).json({ error: "unauthorized" });

  const name = capitalizeName(asString(req.body?.name));
  const baseProductLineId = asId(req.body?.baseProductLineId);
  const cupId = asId(req.body?.cupId);
  const brandId = asId(req.body?.brandId);
  const customSplashId = asId(req.body?.customSplashId);
  const machineIds = asIds(req.body?.machineIds);
  const allowedMachineIds = new Set(session.machines.map((machine) => String(machine.id)));

  if (machineIds.some((id) => !allowedMachineIds.has(id))) {
    return res.status(403).json({
      error: "invalid_machine",
      message: "Every selected machine must belong to your client account.",
    });
  }

  if (session.access === "client" && !machineIds.length) {
    return res.status(400).json({
      error: "machine_required",
      message: "Select at least one machine for this product line.",
    });
  }

  if (name.length < 2 || name.length > 100) {
    return res.status(400).json({
      error: "invalid_name",
      message: "Name must contain between 2 and 100 characters.",
    });
  }

  if (!baseProductLineId || !cupId || !brandId) {
    return res.status(400).json({
      error: "missing_selection",
      message: "Base product line, cup, and brand are required.",
    });
  }

  try {
    const baseProductLineParams = new URLSearchParams();
    baseProductLineParams.set("filters[id][$eq]", baseProductLineId);
    baseProductLineParams.set("filters[author][username][$eq]", "root");
    baseProductLineParams.set("pagination[pageSize]", "1000");

    const duplicateParams = new URLSearchParams();
    duplicateParams.set("filters[name][$eqi]", name);
    if (session.access === "client") {
      duplicateParams.set(
        "filters[author][client][id][$eq]",
        String(session.client.id),
      );
    } else {
      duplicateParams.set("filters[author][id][$eq]", String(session.user.id));
    }
    duplicateParams.set("pagination[pageSize]", "1");

    const [baseProductLines, cup, brand, customSplash, duplicateProductLines] =
      await Promise.all([
        requestStrapiRestAsService<PortalProductLine[]>(
          `/api/product-lines?${baseProductLineParams.toString()}`,
        ),
        requestStrapiRestAsService<PortalCup>(`/api/cups/${cupId}`),
        requestStrapiRestAsService<PortalBrand>(`/api/brands/${brandId}`),
        customSplashId
          ? requestStrapiRestAsService<PortalSplash>(
              `/api/splashes/${customSplashId}`,
            )
          : Promise.resolve(null),
        requestStrapiRestAsService<PortalProductLine[]>(
          `/api/product-lines?${duplicateParams.toString()}`,
        ),
      ]);
    const baseProductLine = baseProductLines[0];

    if (duplicateProductLines.length) {
      return res.status(409).json({
        error: "duplicate_name",
        message: "A product line with this name already exists.",
      });
    }

    if (!baseProductLine?.id) {
      return res.status(400).json({
        error: "invalid_base_product_line",
        message: "The base product line must belong to root.",
      });
    }

    if (!cup?.id || !brand?.id) {
      return res.status(400).json({
        error: "invalid_selection",
        message: "The selected cup or brand no longer exists.",
      });
    }

    if (customSplash && customSplash.isEmpty !== true) {
      return res.status(400).json({
        error: "invalid_custom_splash",
        message: "The selected custom splash is not available.",
      });
    }

    const productLine = await requestStrapiRestAsService<PortalProductLine>(
      "/api/product-lines",
      {
        method: "POST",
        body: JSON.stringify({
          data: {
            name,
            base_product_line: baseProductLine.id,
            cup: cup.id,
            brands: [brand.id],
            author: session.user.id,
            ...(session.access === "client" ? { client: session.client.id } : {}),
            machines: machineIds,
            ...(customSplash ? { custom_splash: customSplash.id } : {}),
          },
        }),
      },
    );

    return res.status(201).json({ productLine });
  } catch (error) {
    console.error("[portal/product-lines] creation failed:", error);
    return res.status(500).json({
      error: "product_line_creation_failed",
      message: "Product line could not be created.",
    });
  }
}
