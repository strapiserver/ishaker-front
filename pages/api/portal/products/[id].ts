import type { NextApiRequest, NextApiResponse } from "next";
import { getPortalSessionFromApiRequest } from "../../../../lib/portal/auth";
import { requestStrapiRestAsService } from "../../../../services/server/strapiClient";
import type { PortalProduct } from "../../../../types/portal";

const asId = (value: unknown) => {
  const id = typeof value === "string" ? value.trim() : "";
  return /^\d+$/.test(id) ? id : "";
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const session = await getPortalSessionFromApiRequest(req);
  if (!session) return res.status(401).json({ error: "unauthorized" });

  const productId = asId(Array.isArray(req.query.id) ? req.query.id[0] : req.query.id);
  if (!productId) return res.status(400).json({ error: "invalid_product" });

  const params = new URLSearchParams();
  params.set("fields[0]", "name");
  params.set("fields[1]", "description");
  params.set("fields[2]", "category");
  params.set("fields[3]", "serving_qty");
  params.set("fields[4]", "serving_unit");
  params.set("populate[custom_main][fields][0]", "url");
  params.set("populate[custom_splash][fields][0]", "isEmpty");
  params.set("populate[custom_splash][populate][images][fields][0]", "url");
  params.set("populate[custom_splash][populate][images][fields][1]", "name");
  params.set("populate[taste][populate][default_splash][populate][images][fields][0]", "url");
  params.set("populate[taste][populate][default_splash][populate][images][fields][1]", "name");
  params.set("populate[taste][populate][default_splash][fields][0]", "isEmpty");
  params.set("populate[taste][populate][default_splash][fields][1]", "name");
  params.set("populate[taste][populate][default_circle][fields][0]", "name");
  params.set("populate[taste][populate][main][fields][0]", "url");
  params.set("populate[taste][populate][main][fields][1]", "formats");
  params.set("populate[components][fields][0]", "name");
  params.set("populate[components][fields][1]", "unit");
  params.set("populate[components][fields][2]", "default_value");
  params.set("populate[nutrition]", "*");
  params.set("populate[dosage]", "*");

  try {
    const product = await requestStrapiRestAsService<PortalProduct>(
      `/api/products/${productId}?${params.toString()}`,
    );
    return res.status(200).json({ product });
  } catch (error) {
    console.error("[portal/products/:id] loading failed:", error);
    return res.status(404).json({
      error: "product_not_found",
      message: "Product could not be loaded.",
    });
  }
}
