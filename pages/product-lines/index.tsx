import type { GetServerSideProps } from "next";
import {
  ProductLinesPage,
  type ProductLinesPageProps,
} from "../../components/portal/product-lines";
import { requirePortalSession } from "../../lib/portal/auth";
import { requestStrapiRestAsService } from "../../services/server/strapiClient";
import type { PortalProductLine } from "../../types/portal";

export default ProductLinesPage;

const createListParams = (authorId: number) => {
  const params = new URLSearchParams();
  params.set("filters[author][id][$eq]", String(authorId));
  params.set("populate[0]", "author");
  params.set("populate[1]", "cup.image");
  params.set("populate[2]", "brands.logo");
  params.set("populate[3]", "base_product_line");
  params.set("populate[4]", "products");
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
    const productLines = await requestStrapiRestAsService<PortalProductLine[]>(
      `/api/product-lines?${createListParams(result.session.user.id).toString()}`,
    );

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
