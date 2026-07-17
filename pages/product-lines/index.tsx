import type { GetServerSideProps } from "next";
import {
  ProductLinesPage,
  type ProductLinesPageProps,
} from "../../components/portal/product-lines";
import { requirePortalSession } from "../../lib/portal/auth";
import { requestStrapiRestAsService } from "../../services/server/strapiClient";
import type { PortalProduct, PortalProductLine, PortalSession } from "../../types/portal";

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
  params.set("populate[1]", "cup.image");
  params.set("populate[2]", "brands.logo");
  params.set("populate[3]", "base_product_line");
  params.set("populate[4]", "machines");
  params.set("sort[0]", "name:ASC");
  params.set("pagination[pageSize]", "1000");
  return params;
};

const createProductParams = (
  authorId: number,
  productLines: PortalProductLine[],
) => {
  const params = new URLSearchParams();
  params.set("filters[author][id][$eq]", String(authorId));
  productLines.forEach((productLine, index) => {
    params.set(
      `filters[product_line][id][$in][${index}]`,
      String(productLine.id),
    );
  });
  params.set("fields[0]", "name");
  params.set("populate[0]", "custom_main");
  params.set("populate[1]", "taste.main");
  params.set("populate[2]", "product_line");
  params.set("sort[0]", "name:ASC");
  params.set("pagination[pageSize]", "1000");
  return params;
};

export const getServerSideProps: GetServerSideProps<ProductLinesPageProps> = async (
  context,
) => {
  const result = await requirePortalSession(context);
  if ("redirect" in result) return { redirect: result.redirect };

  try {
    const ownProductLines = await requestStrapiRestAsService<PortalProductLine[]>(
      `/api/product-lines?${createProductLineParams(result.session).toString()}`,
    );
    const ownProducts = ownProductLines.length
      ? await requestStrapiRestAsService<ProductWithLine[]>(
          `/api/products?${createProductParams(
            result.session.user.id,
            ownProductLines,
          ).toString()}`,
        )
      : [];
    const productLines = ownProductLines.map((productLine) => ({
      ...productLine,
      products: ownProducts.filter(
        (product) =>
          String(product.product_line?.id) === String(productLine.id),
      ),
    }));

    return { props: { session: result.session, productLines } };
  } catch (error) {
    console.error("[product-lines] loading failed:", error);
    return {
      props: {
        session: result.session,
        productLines: [],
        loadError: "Product lines could not be loaded.",
      },
    };
  }
};
