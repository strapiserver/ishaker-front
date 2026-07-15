import type { NextApiRequest, NextApiResponse } from "next";
import { capitalizeName } from "../../../../lib/formatName";
import { getPortalSessionFromApiRequest } from "../../../../lib/portal/auth";
import { requestStrapiRestAsService } from "../../../../services/server/strapiClient";
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

const createOwnershipParams = (id: string, authorId: number) => {
  const params = new URLSearchParams();
  params.set("filters[id][$eq]", id);
  params.set("filters[author][id][$eq]", String(authorId));
  params.set("pagination[pageSize]", "1000");
  return params;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH" && req.method !== "DELETE") {
    res.setHeader("Allow", ["PATCH", "DELETE"]);
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const session = await getPortalSessionFromApiRequest(req);
  if (!session) return res.status(401).json({ error: "unauthorized" });

  const productLineId = asId(Array.isArray(req.query.id) ? req.query.id[0] : req.query.id);
  if (!productLineId) {
    return res.status(400).json({ error: "invalid_product_line" });
  }

  try {
    const ownedProductLines = await requestStrapiRestAsService<PortalProductLine[]>(
      `/api/product-lines?${createOwnershipParams(productLineId, session.user.id).toString()}`,
    );
    const ownedProductLine = ownedProductLines[0];

    if (!ownedProductLine?.id) {
      return res.status(404).json({
        error: "product_line_not_found",
        message: "Product line was not found or does not belong to you.",
      });
    }

    if (req.method === "DELETE") {
      await requestStrapiRestAsService(`/api/product-lines/${ownedProductLine.id}`, {
        method: "DELETE",
      });
      return res.status(200).json({ deleted: true });
    }

    const name = capitalizeName(asString(req.body?.name));
    const baseProductLineId = asId(req.body?.baseProductLineId);
    const cupId = asId(req.body?.cupId);
    const brandId = asId(req.body?.brandId);
    const customSplashId = asId(req.body?.customSplashId);

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

    const baseParams = new URLSearchParams();
    baseParams.set("filters[id][$eq]", baseProductLineId);
    baseParams.set("filters[author][username][$eq]", "root");
    baseParams.set("pagination[pageSize]", "1000");

    const [baseProductLines, cup, brand, customSplash] = await Promise.all([
      requestStrapiRestAsService<PortalProductLine[]>(
        `/api/product-lines?${baseParams.toString()}`,
      ),
      requestStrapiRestAsService<PortalCup>(`/api/cups/${cupId}`),
      requestStrapiRestAsService<PortalBrand>(`/api/brands/${brandId}`),
      customSplashId
        ? requestStrapiRestAsService<PortalSplash>(`/api/splashes/${customSplashId}`)
        : Promise.resolve(null),
    ]);
    const baseProductLine = baseProductLines[0];

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
      `/api/product-lines/${ownedProductLine.id}`,
      {
        method: "PUT",
        body: JSON.stringify({
          data: {
            name,
            base_product_line: baseProductLine.id,
            cup: cup.id,
            brands: [brand.id],
            custom_splash: customSplash?.id || null,
          },
        }),
      },
    );

    return res.status(200).json({ productLine });
  } catch (error) {
    console.error("[portal/product-lines/:id] request failed:", error);
    return res.status(500).json({
      error: "product_line_request_failed",
      message: `Product line could not be ${req.method === "DELETE" ? "deleted" : "updated"}.`,
    });
  }
}
