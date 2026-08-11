import type { GetServerSideProps } from "next";
import {
  NewProductLinePage,
  type NewProductLinePageProps,
} from "../../../components/portal/product-lines";
import { requirePortalSession } from "../../../lib/portal/auth";
import { requestStrapiRestAsService } from "../../../services/server/strapiClient";
import type {
  PortalProductLine,
  PortalSplash,
} from "../../../types/portal";

export default NewProductLinePage;

const asId = (value: string | string[] | undefined) => {
  const id = Array.isArray(value) ? value[0] : value;
  return id && /^\d+$/.test(id) ? id : "";
};

export const getServerSideProps: GetServerSideProps<NewProductLinePageProps> = async (
  context,
) => {
  const result = await requirePortalSession(context);
  if ("redirect" in result) return { redirect: result.redirect };

  const productLineId = asId(context.params?.id);
  if (!productLineId) return { notFound: true };

  const ownParams = new URLSearchParams();
  ownParams.set("filters[id][$eq]", productLineId);
  if (result.session.client.id) {
    ownParams.set(
      "filters[author][client][id][$eq]",
      String(result.session.client.id),
    );
  } else {
    ownParams.set("filters[author][id][$eq]", String(result.session.user.id));
  }
  ownParams.set("populate[0]", "base_product_line");
  ownParams.set("populate[1]", "cups.image");
  ownParams.set("populate[2]", "cups.default_splash");
  ownParams.set("populate[3]", "custom_splash");
  ownParams.set("pagination[pageSize]", "2000");

  const rootParams = new URLSearchParams();
  rootParams.set("filters[author][username][$eq]", "root");
  rootParams.set("populate[0]", "cups.image");
  rootParams.set("populate[1]", "cups.default_splash");
  rootParams.set("populate[2]", "custom_splash");
  rootParams.set("sort[0]", "isPopular:DESC");
  rootParams.set("sort[1]", "name:ASC");
  rootParams.set("pagination[pageSize]", "2000");

  const splashParams = new URLSearchParams();
  splashParams.set("fields[0]", "name");
  splashParams.set("fields[1]", "color");
  splashParams.set("fields[2]", "isEmpty");
  splashParams.set("sort[0]", "name:ASC");
  splashParams.set("pagination[pageSize]", "2000");

  try {
    const [ownProductLines, rootProductLines, splashes] =
      await Promise.all([
        requestStrapiRestAsService<PortalProductLine[]>(
          `/api/product-lines?${ownParams.toString()}`,
        ),
        requestStrapiRestAsService<PortalProductLine[]>(
          `/api/product-lines?${rootParams.toString()}`,
        ),
        requestStrapiRestAsService<PortalSplash[]>(
          `/api/splashes?${splashParams.toString()}`,
        ),
      ]);

    if (!ownProductLines[0]) return { notFound: true };

    return {
      props: {
        session: result.session,
        productLine: ownProductLines[0],
        rootProductLines,
        splashes,
      },
    };
  } catch (error) {
    console.error("[product-lines/edit] option loading failed:", error);
    return {
      props: {
        session: result.session,
        rootProductLines: [],
        splashes: [],
        loadError: "Product line options could not be loaded.",
      },
    };
  }
};
