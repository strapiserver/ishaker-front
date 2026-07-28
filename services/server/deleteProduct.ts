import { requestStrapiRestAsService } from "./strapiClient";

type StrapiRecord = {
  id: string | number;
};

export const deleteProductAndAssignments = async (
  productId: string | number,
) => {
  const references = new URLSearchParams();
  references.set("filters[product][id][$eq]", String(productId));
  references.set("fields[0]", "id");
  references.set("pagination[pageSize]", "2000");

  const [machineCells, presetCells] = await Promise.all([
    requestStrapiRestAsService<StrapiRecord[]>(
      `/api/machine-cells?${references.toString()}`,
    ),
    requestStrapiRestAsService<StrapiRecord[]>(
      `/api/preset-cells?${references.toString()}`,
    ),
  ]);

  await Promise.all([
    ...machineCells.map((cell) =>
      requestStrapiRestAsService(`/api/machine-cells/${cell.id}`, {
        method: "DELETE",
      }),
    ),
    ...presetCells.map((cell) =>
      requestStrapiRestAsService(`/api/preset-cells/${cell.id}`, {
        method: "DELETE",
      }),
    ),
  ]);

  await requestStrapiRestAsService(`/api/products/${productId}`, {
    method: "DELETE",
  });

  return {
    deletedMachineAssignments: machineCells.length,
    deletedPresetAssignments: presetCells.length,
  };
};
