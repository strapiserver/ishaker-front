import type { GetServerSideProps } from "next";
import {
  NewProductLinePage,
  type NewProductLinePageProps,
} from "../../components/portal/product-lines";
import { requirePortalSession } from "../../lib/portal/auth";
import { requestStrapiRestAsService } from "../../services/server/strapiClient";
import type {
  PortalProductLine,
  PortalSplash,
} from "../../types/portal";

export default NewProductLinePage;

export const getServerSideProps: GetServerSideProps<NewProductLinePageProps> = async (
  context,
) => {
  const result = await requirePortalSession(context);
  if ("redirect" in result) return { redirect: result.redirect };

  const rootParams = new URLSearchParams();
  rootParams.set("filters[author][username][$eq]", "root");
  rootParams.set("populate[0]", "cup.image");
  rootParams.set("populate[1]", "custom_splash");
  rootParams.set("sort[0]", "isPopular:DESC");
  rootParams.set("sort[1]", "name:ASC");
  rootParams.set("pagination[pageSize]", "2000");

  const splashParams = new URLSearchParams();
  splashParams.set("filters[isEmpty][$eq]", "true");
  splashParams.set("fields[0]", "name");
  splashParams.set("fields[1]", "color");
  splashParams.set("fields[2]", "isEmpty");
  splashParams.set("sort[0]", "name:ASC");
  splashParams.set("pagination[pageSize]", "2000");

  try {
    const rootProductLines = await requestStrapiRestAsService<PortalProductLine[]>(
      `/api/product-lines?${rootParams.toString()}`,
    );
    const splashes = await requestStrapiRestAsService<PortalSplash[]>(
      `/api/splashes?${splashParams.toString()}`,
    ).catch((error) => {
      console.error("[product-lines/new] splash option loading failed:", error);
      return [];
    });

    return {
      props: {
        session: result.session,
        rootProductLines,
        splashes,
      },
    };
  } catch (error) {
    console.error("[product-lines/new] option loading failed:", error);
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
