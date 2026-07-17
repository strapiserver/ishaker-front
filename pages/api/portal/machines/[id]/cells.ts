import type { NextApiRequest, NextApiResponse } from "next";
import { getPortalSessionFromApiRequest } from "../../../../../lib/portal/auth";
import {
  getMachineCatalogProducts,
  getMachineCells,
  updateMachineCell,
} from "../../../../../services/server/machineCells";

type Assignment = {
  position: number;
  productId: number | null;
  isActive: boolean;
};

const asId = (value: string | string[] | undefined) => {
  const id = Array.isArray(value) ? value[0] : value;
  return id && /^\d+$/.test(id) ? id : "";
};

const parseAssignments = (value: unknown): Assignment[] | null => {
  if (!Array.isArray(value) || value.length > 200) return null;

  const assignments = value.map((item) => {
    const row = item && typeof item === "object" ? item : {};
    const position = Number((row as { position?: unknown }).position);
    const rawProductId = (row as { productId?: unknown }).productId;
    const productId = rawProductId === null ? null : Number(rawProductId);
    const isActive = (row as { isActive?: unknown }).isActive;
    return { position, productId, isActive };
  });

  if (
    assignments.some(
      (assignment) =>
        !Number.isInteger(assignment.position) ||
        assignment.position < 0 ||
        (assignment.productId !== null &&
          (!Number.isInteger(assignment.productId) || assignment.productId <= 0)) ||
        typeof assignment.isActive !== "boolean",
    )
  ) {
    return null;
  }

  if (new Set(assignments.map((assignment) => assignment.position)).size !== assignments.length) {
    return null;
  }

  return assignments as Assignment[];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "PUT") {
    res.setHeader("Allow", ["GET", "PUT"]);
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const session = await getPortalSessionFromApiRequest(req);
  if (!session) return res.status(401).json({ error: "unauthorized" });

  const machineId = asId(req.query.id);
  const allowed = new Set(session.machines.map((machine) => String(machine.id)));
  if (!machineId || !allowed.has(machineId)) {
    return res.status(403).json({ error: "machine_access_denied" });
  }

  try {
    const cells = await getMachineCells(machineId);
    if (req.method === "GET") return res.status(200).json(cells);

    const assignments = parseAssignments(req.body?.assignments);
    if (!assignments) {
      return res.status(400).json({
        error: "invalid_assignments",
        message: "Assignments must contain valid, unique seeded positions.",
      });
    }

    const cellsByPosition = new Map(cells.map((cell) => [cell.position, cell]));
    const unknownPosition = assignments.find(
      (assignment) => !cellsByPosition.has(assignment.position),
    );
    if (unknownPosition) {
      return res.status(400).json({
        error: "unknown_position",
        message: `Container position ${unknownPosition.position} is not initialized.`,
      });
    }

    const products = await getMachineCatalogProducts(machineId, session.client.id);
    const productsById = new Map(products.map((product) => [String(product.id), product]));
    for (const assignment of assignments) {
      if (assignment.productId === null) continue;

      const product = productsById.get(String(assignment.productId));
      if (!product) {
        return res.status(400).json({
          error: "product_not_in_catalog",
          message: `Product ${assignment.productId} is not in this machine's catalog.`,
        });
      }

      const cell = cellsByPosition.get(assignment.position)!;
      if (cell.cell_category && product.product_type !== cell.cell_category) {
        return res.status(400).json({
          error: "category_mismatch",
          message: `Container ${cell.position} requires a ${cell.cell_category} product.`,
        });
      }
    }

    const assignmentsByPosition = new Map(
      assignments.map((assignment) => [assignment.position, assignment]),
    );
    const activeProductIds = cells
      .map((cell) => {
        const assignment = assignmentsByPosition.get(cell.position);
        return assignment || {
          position: cell.position,
          productId: cell.product?.id ?? null,
          isActive: cell.isActive,
        };
      })
      .filter((assignment) => assignment.isActive && assignment.productId !== null)
      .map((assignment) => String(assignment.productId));
    if (new Set(activeProductIds).size !== activeProductIds.length) {
      return res.status(400).json({
        error: "duplicate_active_product",
        message: "A product cannot be assigned to two active containers.",
      });
    }

    await Promise.all(
      assignments.map((assignment) => {
        const cell = cellsByPosition.get(assignment.position)!;
        return updateMachineCell(cell.id, assignment.productId, assignment.isActive);
      }),
    );

    const refreshedCells = await getMachineCells(machineId);
    return res.status(200).json(refreshedCells);
  } catch (error) {
    console.error("[portal/machines/:id/cells] request failed:", error);
    return res.status(500).json({
      error: "machine_cells_request_failed",
      message: "Machine containers could not be updated.",
    });
  }
}
