import type { NextApiRequest, NextApiResponse } from "next";
import { getPortalSessionFromApiRequest } from "../../../../../../lib/portal/auth";
import { requestStrapiRestAsService } from "../../../../../../services/server/strapiClient";
import type { PortalProductLine } from "../../../../../../types/portal";

const asId = (value: unknown) => {
  const id = typeof value === "string" ? value.trim() : "";
  return /^\d+$/.test(id) ? id : "";
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const session = await getPortalSessionFromApiRequest(req);
  if (!session) return res.status(401).json({ error: "unauthorized" });

  const productLineId = asId(
    Array.isArray(req.query.id) ? req.query.id[0] : req.query.id,
  );
  const productId = asId(
    Array.isArray(req.query.productId)
      ? req.query.productId[0]
      : req.query.productId,
  );
  if (!productLineId || !productId) {
    return res.status(400).json({ error: "invalid_product" });
  }

  const params = new URLSearchParams();
  params.set("filters[id][$eq]", productLineId);
  params.set("filters[author][id][$eq]", String(session.user.id));
  params.set("populate[products][fields][0]", "name");
  params.set(
    "populate[products][filters][author][id][$eq]",
    String(session.user.id),
  );
  params.set("pagination[pageSize]", "1");

  try {
    const productLines = await requestStrapiRestAsService<PortalProductLine[]>(
      `/api/product-lines?${params.toString()}`,
    );
    const productLine = productLines[0];
    const containsProduct = productLine?.products?.some(
      (product) => String(product.id) === productId,
    );

    if (!productLine?.id || !containsProduct) {
      return res.status(404).json({
        error: "product_not_found",
        message: "Product was not found in this product line.",
      });
    }

    await requestStrapiRestAsService(`/api/product-lines/${productLine.id}`, {
      method: "PUT",
      body: JSON.stringify({
        data: { products: { disconnect: [productId] } },
      }),
    });

    return res.status(200).json({ deleted: true });
  } catch (error) {
    console.error(
      "[portal/product-lines/:id/products/:productId] deletion failed:",
      error,
    );
    return res.status(500).json({
      error: "product_deletion_failed",
      message: "Product could not be deleted.",
    });
  }
}
