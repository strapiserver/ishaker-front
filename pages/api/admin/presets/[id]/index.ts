import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApiSession } from "../../../../../lib/admin/auth";
import { requestStrapiRestAsService } from "../../../../../services/server/strapiClient";
import { arePopularProductsValid, parseCells } from "../index";

const idFrom = (value: string | string[] | undefined) => {
  const id = Array.isArray(value) ? value[0] : value;
  return id && /^\d+$/.test(id) ? id : "";
};
const relationId = (value: unknown) => {
  const id = typeof value === "string" ? value.trim() : "";
  return /^\d+$/.test(id) ? Number(id) : null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!requireAdminApiSession(req, res)) return;
  if (req.method !== "PUT" && req.method !== "DELETE") {
    res.setHeader("Allow", ["PUT", "DELETE"]);
    return res.status(405).json({ error: "method_not_allowed" });
  }
  const presetId = idFrom(req.query.id);
  if (!presetId) return res.status(400).json({ error: "invalid_preset" });

  try {
    const existingCells: any[] = await requestStrapiRestAsService(
      `/api/preset-cells?filters[preset][id][$eq]=${presetId}&pagination[pageSize]=2000`,
    );

    if (req.method === "DELETE") {
      for (const cell of existingCells) {
        await requestStrapiRestAsService(`/api/preset-cells/${cell.id}`, {
          method: "DELETE",
        });
      }
      await requestStrapiRestAsService(`/api/presets/${presetId}`, {
        method: "DELETE",
      });
      return res.status(200).json({ deleted: true });
    }

    const cells = parseCells(req.body?.cells);
    const machineTypeId = relationId(req.body?.machineTypeId);
    const currencyId = relationId(req.body?.currencyId);
    const languageId = relationId(req.body?.languageId);
    const productLineId = relationId(req.body?.productLineId);
    if (
      !req.body?.name?.trim() ||
      !req.body?.slug?.trim() ||
      !machineTypeId ||
      !currencyId ||
      !languageId ||
      !productLineId ||
      !cells
    ) {
      return res.status(400).json({ error: "invalid_preset" });
    }
    if (!(await arePopularProductsValid(productLineId, cells))) {
      return res.status(400).json({
        error: "invalid_preset_products",
        message:
          "Every planogram product must be popular and belong to the selected product line.",
      });
    }

    await requestStrapiRestAsService(`/api/presets/${presetId}`, {
      method: "PUT",
      body: JSON.stringify({
        data: {
          name: req.body.name.trim(),
          slug: req.body.slug.trim(),
          description:
            typeof req.body.description === "string"
              ? req.body.description.trim()
              : "",
          isDefault: req.body.isDefault === true,
          isActive: req.body.isActive !== false,
          is_template: req.body.isTemplate === true,
          machine_type: machineTypeId,
          currency: currencyId,
          language: languageId,
          product_line: productLineId,
        },
      }),
    });

    const existingByPosition = new Map(
      existingCells.map((cell) => [Number(cell.position), cell]),
    );
    const nextPositions = new Set(cells.map((cell) => cell.position));
    for (const cell of existingCells) {
      if (!nextPositions.has(Number(cell.position))) {
        await requestStrapiRestAsService(`/api/preset-cells/${cell.id}`, {
          method: "DELETE",
        });
      }
    }
    for (const cell of cells) {
      const existing = existingByPosition.get(cell.position);
      await requestStrapiRestAsService(
        existing ? `/api/preset-cells/${existing.id}` : "/api/preset-cells",
        {
          method: existing ? "PUT" : "POST",
          body: JSON.stringify({
            data: {
              ...(!existing ? { preset: Number(presetId) } : {}),
              position: cell.position,
              cell_category: cell.cellCategory,
              product: cell.productId,
              price: cell.price,
              isActive: cell.isActive,
            },
          }),
        },
      );
    }
    return res.status(200).json({ updated: true });
  } catch (error) {
    console.error("[admin/presets/:id] request failed:", error);
    return res.status(500).json({ error: "preset_request_failed" });
  }
}
