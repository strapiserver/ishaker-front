import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApiSession } from "../../../../lib/admin/auth";
import { requestStrapiRestAsService } from "../../../../services/server/strapiClient";

const asString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";
const asId = (value: unknown) => {
  const id = asString(value);
  return /^\d+$/.test(id) ? Number(id) : null;
};
const asPrice = (value: unknown) => {
  if (value === "" || value === null || value === undefined) return null;
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : undefined;
};

type PresetCellInput = {
  position: number;
  cellCategory: "powder" | "concentrate";
  productId: number;
  price: number | null;
  isActive: boolean;
};

const arePopularProductsValid = async (
  productLineId: number,
  cells: PresetCellInput[],
) => {
  const productLine: any = await requestStrapiRestAsService(
    `/api/product-lines/${productLineId}?populate[products][fields][0]=id&populate[products][fields][1]=isPopular`,
  );
  const productIds = new Set(
    (productLine.products || [])
      .filter((product: any) => product.isPopular === true)
      .map((product: any) => Number(product.id)),
  );
  return cells.every((cell) => productIds.has(cell.productId));
};

const parseCells = (value: unknown): PresetCellInput[] | null => {
  if (!Array.isArray(value) || value.length > 200) return null;
  const cells = value.map((row: any) => ({
    position: Number(row?.position),
    cellCategory: row?.cellCategory,
    productId: Number(row?.productId),
    price: asPrice(row?.price),
    isActive: row?.isActive !== false,
  }));
  if (
    cells.some(
      (cell) =>
        !Number.isInteger(cell.position) ||
        cell.position < 0 ||
        !["powder", "concentrate"].includes(cell.cellCategory) ||
        !Number.isInteger(cell.productId) ||
        cell.productId <= 0 ||
        cell.price === undefined,
    ) ||
    new Set(cells.map((cell) => cell.position)).size !== cells.length
  ) {
    return null;
  }
  return cells as PresetCellInput[];
};

const presetPopulateQuery =
  "populate[machine_type]=*&populate[currency]=*&populate[language]=*&" +
  "populate[product_line]=*&populate[cells][populate][product][populate][dosage]=*&" +
  "sort[0]=name:ASC&pagination[pageSize]=2000";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!requireAdminApiSession(req, res)) return;
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "method_not_allowed" });
  }

  if (req.method === "GET") {
    try {
      res.setHeader("Cache-Control", "no-store, max-age=0");
      const [presets, machineTypes, currencies, languages, productLines, products, machines] =
        await Promise.all([
          requestStrapiRestAsService(`/api/presets?${presetPopulateQuery}`),
          requestStrapiRestAsService(
            "/api/machine-types?sort[0]=name:ASC&pagination[pageSize]=2000",
          ),
          requestStrapiRestAsService(
            "/api/currencies?sort[0]=code:ASC&pagination[pageSize]=2000",
          ),
          requestStrapiRestAsService(
            "/api/languages?sort[0]=sort_order:ASC&sort[1]=name:ASC&pagination[pageSize]=2000",
          ),
          requestStrapiRestAsService(
            "/api/product-lines?sort[0]=name:ASC&pagination[pageSize]=2000",
          ),
          requestStrapiRestAsService(
            "/api/products?filters[isPopular][$eq]=true&" +
              "populate[dosage]=*&populate[product_line]=*&" +
              "populate[custom_main][fields][0]=url&populate[custom_main][fields][1]=formats&" +
              "populate[taste][populate][main][fields][0]=url&populate[taste][populate][main][fields][1]=formats&" +
              "populate[brand][fields][0]=name&populate[brand][populate][logo][fields][0]=url&" +
              "populate[brand][populate][logo][fields][1]=formats&" +
              "sort[0]=name:ASC&pagination[pageSize]=2000",
          ),
          requestStrapiRestAsService(
            "/api/machines?populate[0]=currency&populate[1]=language&sort[0]=title:ASC&pagination[pageSize]=2000",
          ),
        ]);
      return res.status(200).json({
        presets,
        options: { machineTypes, currencies, languages, productLines, products, machines },
      });
    } catch (error) {
      console.error("[admin/presets] load failed:", error);
      return res.status(500).json({ error: "preset_load_failed" });
    }
  }

  const name = asString(req.body?.name);
  const slug = asString(req.body?.slug);
  const machineTypeId = asId(req.body?.machineTypeId);
  const currencyId = asId(req.body?.currencyId);
  const languageId = asId(req.body?.languageId);
  const productLineId = asId(req.body?.productLineId);
  const cells = parseCells(req.body?.cells);
  if (
    !name ||
    !slug ||
    !machineTypeId ||
    !currencyId ||
    !languageId ||
    !productLineId ||
    !cells
  ) {
    return res.status(400).json({
      error: "invalid_preset",
      message: "Complete all preset fields and enter valid unique planogram positions.",
    });
  }

  try {
    if (!(await arePopularProductsValid(productLineId, cells))) {
      return res.status(400).json({
        error: "invalid_preset_products",
        message:
          "Every planogram product must be popular and belong to the selected product line.",
      });
    }
    const preset: any = await requestStrapiRestAsService("/api/presets", {
      method: "POST",
      body: JSON.stringify({
        data: {
          name,
          slug,
          description: asString(req.body?.description),
          isDefault: req.body?.isDefault === true,
          isActive: req.body?.isActive !== false,
          is_template: req.body?.isTemplate === true,
          machine_type: machineTypeId,
          currency: currencyId,
          language: languageId,
          product_line: productLineId,
        },
      }),
    });
    await Promise.all(
      cells.map((cell) =>
        requestStrapiRestAsService("/api/preset-cells", {
          method: "POST",
          body: JSON.stringify({
            data: {
              preset: preset.id,
              position: cell.position,
              cell_category: cell.cellCategory,
              product: cell.productId,
              price: cell.price,
              isActive: cell.isActive,
            },
          }),
        }),
      ),
    );
    return res.status(201).json({ preset });
  } catch (error) {
    console.error("[admin/presets] create failed:", error);
    return res.status(500).json({
      error: "preset_create_failed",
      message: "Preset could not be created.",
    });
  }
}

export { arePopularProductsValid, parseCells, presetPopulateQuery };
