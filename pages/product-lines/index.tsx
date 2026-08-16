import type { GetServerSideProps } from "next";
import {
  ProductLinesPage,
  type MachineContainerAssignment,
  type ProductLinesPageProps,
} from "../../components/portal/product-lines";
import { requirePortalSession } from "../../lib/portal/auth";
import {
  getMachineCatalogProducts,
  getMachineCells,
} from "../../services/server/machineCells";
import { requestStrapiRestAsService } from "../../services/server/strapiClient";
import type {
  PortalCatalogProduct,
  PortalProduct,
  PortalProductLine,
  PortalSession,
} from "../../types/portal";

export default ProductLinesPage;

type ProductWithLine = PortalProduct & {
  product_line?: Pick<PortalProductLine, "id" | "name"> | null;
};

const createProductLineParams = (session: PortalSession) => {
  const params = new URLSearchParams();
  if (session.access === "client") {
    params.set("filters[author][client][id][$eq]", String(session.client.id));
  } else {
    params.set("filters[author][id][$eq]", String(session.user.id));
  }
  params.set("populate[0]", "author");
  params.set("populate[1]", "cups.image");
  params.set("populate[2]", "base_product_line");
  params.set("sort[0]", "name:ASC");
  params.set("pagination[pageSize]", "2000");
  return params;
};

const createProductParams = (session: PortalSession) => {
  const params = new URLSearchParams();
  if (session.access === "client") {
    params.set("filters[author][client][id][$eq]", String(session.client.id));
  } else {
    params.set("filters[author][id][$eq]", String(session.user.id));
  }
  params.set("fields[0]", "name");
  params.set("fields[1]", "isActive");
  params.set("fields[2]", "product_type");
  params.set("populate[0]", "custom_main");
  params.set("populate[1]", "taste.main");
  params.set("populate[2]", "product_line");
  params.set("populate[3]", "brand.logo");
  params.set("populate[4]", "dosage");
  params.set("sort[0]", "name:ASC");
  params.set("pagination[pageSize]", "2000");
  return params;
};

export const getServerSideProps: GetServerSideProps<ProductLinesPageProps> = async (
  context,
) => {
  const result = await requirePortalSession(context);
  if ("redirect" in result) return { redirect: result.redirect };
  const requestedMachineId = Array.isArray(context.query.machineId)
    ? context.query.machineId[0]
    : context.query.machineId;
  const initialMachineId = result.session.machines.some(
    (machine) => String(machine.id) === requestedMachineId,
  )
    ? requestedMachineId
    : undefined;

  let catalogProducts: PortalCatalogProduct[] = [];
  let machineAssignments: MachineContainerAssignment[] = [];
  try {
    const [catalog, ...cellResults] = await Promise.all([
      result.session.machines[0]
        ? getMachineCatalogProducts(
            result.session.machines[0].id,
            result.session.client.id,
          )
        : Promise.resolve([]),
      ...result.session.machines.map((machine) =>
        getMachineCells(machine.id)
          .then((cells) => ({ machine, cells, loadError: null }))
          .catch((error) => {
            console.error(
              `[product-lines] containers for machine ${machine.id} failed:`,
              error,
            );
            return {
              machine,
              cells: [],
              loadError: "Machine containers could not be loaded.",
            };
          }),
      ),
    ]);
    catalogProducts = catalog;
    machineAssignments = cellResults;
  } catch (error) {
    console.error("[product-lines] container catalog loading failed:", error);
    machineAssignments = result.session.machines.map((machine) => ({
      machine,
      cells: [],
      loadError: "Product library could not be loaded for assignment.",
    }));
  }

  try {
    const ownProductLines = await requestStrapiRestAsService<PortalProductLine[]>(
      `/api/product-lines?${createProductLineParams(result.session).toString()}`,
    );
    const ownProducts = await requestStrapiRestAsService<ProductWithLine[]>(
      `/api/products?${createProductParams(result.session).toString()}`,
    );
    const productLines = ownProductLines.map((productLine) => ({
      ...productLine,
      products: ownProducts.filter(
        (product) =>
          String(product.product_line?.id) === String(productLine.id),
      ),
    }));

    return {
      props: {
        session: result.session,
        productLines,
        orphanProducts: ownProducts.filter((product) => !product.product_line),
        catalogProducts,
        machineAssignments,
        ...(initialMachineId ? { initialMachineId } : {}),
      },
    };
  } catch (error) {
    console.error("[product-lines] loading failed:", error);
    return {
      props: {
        session: result.session,
        productLines: [],
        orphanProducts: [],
        catalogProducts,
        machineAssignments,
        ...(initialMachineId ? { initialMachineId } : {}),
        loadError: "Product lines could not be loaded.",
      },
    };
  }
};
