import type { GetServerSideProps } from "next";
import {
  NewProductLinePage,
  type NewProductLinePageProps,
} from "../../components/portal/product-lines";
import { requirePortalSession } from "../../lib/portal/auth";
import { requestStrapiRestAsService } from "../../services/server/strapiClient";
import type {
  PortalBrand,
  PortalCup,
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
  rootParams.set("populate[1]", "brands.logo");
  rootParams.set("populate[2]", "custom_splash");
  rootParams.set("sort[0]", "isPopular:DESC");
  rootParams.set("sort[1]", "name:ASC");
  rootParams.set("pagination[pageSize]", "1000");

  const cupParams = new URLSearchParams();
  cupParams.set("populate[image][fields][0]", "url");
  cupParams.set("populate[image][fields][1]", "formats");
  cupParams.set("sort[0]", "name:ASC");
  cupParams.set("pagination[pageSize]", "1000");

  const brandParams = new URLSearchParams();
  brandParams.set("populate[logo][fields][0]", "url");
  brandParams.set("populate[logo][fields][1]", "formats");
  brandParams.set("sort[0]", "name:ASC");
  brandParams.set("pagination[pageSize]", "1000");

  const splashParams = new URLSearchParams();
  splashParams.set("filters[isEmpty][$eq]", "true");
  splashParams.set("fields[0]", "name");
  splashParams.set("fields[1]", "color");
  splashParams.set("fields[2]", "isEmpty");
  splashParams.set("sort[0]", "name:ASC");
  splashParams.set("pagination[pageSize]", "1000");

  try {
    const [rootProductLines, cups, brands] = await Promise.all([
      requestStrapiRestAsService<PortalProductLine[]>(
        `/api/product-lines?${rootParams.toString()}`,
      ),
      requestStrapiRestAsService<PortalCup[]>(`/api/cups?${cupParams.toString()}`),
      requestStrapiRestAsService<PortalBrand[]>(`/api/brands?${brandParams.toString()}`),
    ]);
    const splashes = await requestStrapiRestAsService<PortalSplash[]>(
      `/api/splashes?${splashParams.toString()}`,
    ).catch((error) => {
      console.error("[product-lines/new] splash option loading failed:", error);
      return [];
    });

    return {
      props: { session: result.session, rootProductLines, cups, brands, splashes },
    };
  } catch (error) {
    console.error("[product-lines/new] option loading failed:", error);
    return {
      props: {
        session: result.session,
        rootProductLines: [],
        cups: [],
        brands: [],
        splashes: [],
        loadError: "Product line options could not be loaded.",
      },
    };
  }
};
