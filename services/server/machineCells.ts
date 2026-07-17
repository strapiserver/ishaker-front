import type {
  PortalCatalogProduct,
  PortalMachineCell,
  PortalProductLine,
} from "../../types/portal";
import type { Machine } from "../../types/strapi";
import { requestStrapiRestAsService } from "./strapiClient";

const PAGE_SIZE = "1000";

export const getMachineCells = async (
  machineId: string | number,
): Promise<PortalMachineCell[]> => {
  const params = new URLSearchParams();
  params.set("filters[machine][id][$eq]", String(machineId));
  params.set("populate[product][populate][taste]", "*");
  params.set("sort[0]", "position:asc");
  params.set("pagination[pageSize]", "200");

  return requestStrapiRestAsService<PortalMachineCell[]>(
    `/api/machine-cells?${params.toString()}`,
  );
};

const getEffectiveProductLineIds = async (
  machineId: string | number,
  clientId: string | number,
) => {
  const machineParams = new URLSearchParams();
  machineParams.set("fields[0]", "id");
  machineParams.set("populate[product_lines][fields][0]", "id");
  machineParams.set("populate[product_lines][fields][1]", "isActive");

  const machine = await requestStrapiRestAsService<Machine>(
    `/api/machines/${machineId}?${machineParams.toString()}`,
  );
  const assignedLines = machine.product_lines || [];
  if (assignedLines.length) {
    return assignedLines
      .filter((line) => line.isActive !== false)
      .map((line) => String(line.id));
  }

  const fallbackParams = new URLSearchParams();
  fallbackParams.set("filters[author][client][id][$eq]", String(clientId));
  fallbackParams.set("filters[isActive][$ne]", "false");
  fallbackParams.set("filters[is_template][$ne]", "true");
  fallbackParams.set("fields[0]", "id");
  fallbackParams.set("pagination[pageSize]", PAGE_SIZE);

  const lines = await requestStrapiRestAsService<PortalProductLine[]>(
    `/api/product-lines?${fallbackParams.toString()}`,
  );
  return lines.map((line) => String(line.id));
};

export const getMachineCatalogProducts = async (
  machineId: string | number,
  clientId: string | number,
): Promise<PortalCatalogProduct[]> => {
  const productLineIds = await getEffectiveProductLineIds(machineId, clientId);
  if (!productLineIds.length) return [];

  const params = new URLSearchParams();
  productLineIds.forEach((lineId, index) => {
    params.set(`filters[product_line][id][$in][${index}]`, lineId);
  });
  params.set("filters[isActive][$ne]", "false");
  params.set("fields[0]", "name");
  params.set("fields[1]", "product_type");
  params.set("populate[taste][fields][0]", "name");
  params.set("sort[0]", "name:asc");
  params.set("pagination[pageSize]", PAGE_SIZE);

  const products = await requestStrapiRestAsService<PortalCatalogProduct[]>(
    `/api/products?${params.toString()}`,
  );

  return Array.from(
    new Map(products.map((product) => [String(product.id), product])).values(),
  );
};

export const updateMachineCell = async (
  cellId: string | number,
  productId: number | null,
  isActive: boolean,
) =>
  requestStrapiRestAsService(`/api/machine-cells/${cellId}`, {
    method: "PUT",
    body: JSON.stringify({
      data: { product: productId, isActive },
    }),
  });
