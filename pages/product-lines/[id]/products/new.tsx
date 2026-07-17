import type { GetServerSideProps } from "next";
import {
  NewProductPage,
  type NewProductPageProps,
} from "../../../../components/portal/product-lines";
import { requirePortalSession } from "../../../../lib/portal/auth";
import { requestStrapiRestAsService } from "../../../../services/server/strapiClient";
import type {
  PortalCircle,
  PortalComponent,
  PortalProduct,
  PortalProductLine,
  PortalSplash,
  PortalTaste,
} from "../../../../types/portal";

export default NewProductPage;

export const getServerSideProps: GetServerSideProps<NewProductPageProps> = async (
  context,
) => {
  const result = await requirePortalSession(context);
  if ("redirect" in result) return { redirect: result.redirect };

  const rawId = Array.isArray(context.params?.id)
    ? context.params?.id[0]
    : context.params?.id;
  const productLineId = rawId && /^\d+$/.test(rawId) ? rawId : "";
  if (!productLineId) return { notFound: true };
  const requestedProductIdRaw = Array.isArray(context.query.productId)
    ? context.query.productId[0]
    : context.query.productId;
  const requestedProductId =
    requestedProductIdRaw && /^\d+$/.test(requestedProductIdRaw)
      ? requestedProductIdRaw
      : "";

  const params = new URLSearchParams();
  params.set("filters[id][$eq]", productLineId);
  if (result.session.access === "client") {
    params.set(
      "filters[author][client][id][$eq]",
      String(result.session.client.id),
    );
  } else {
    params.set("filters[author][id][$eq]", String(result.session.user.id));
  }
  params.set("fields[0]", "name");
  params.set("populate[cup][populate][image][fields][0]", "url");
  params.set("populate[cup][populate][image][fields][1]", "formats");
  params.set("populate[brands][populate][logo][fields][0]", "url");
  params.set("populate[base_product_line][fields][0]", "name");
  params.set("pagination[pageSize]", "1000");

  const productParams = new URLSearchParams();
  productParams.set("filters[author][username][$eq]", "root");
  productParams.set("fields[0]", "name");
  productParams.set("fields[1]", "description");
  productParams.set("fields[2]", "product_type");
  productParams.set("fields[3]", "serving_qty");
  productParams.set("fields[4]", "serving_unit");
  productParams.set("fields[5]", "product_purpose");
  productParams.set("populate[custom_main][fields][0]", "url");
  productParams.set("populate[custom_main][fields][1]", "formats");
  productParams.set("populate[custom_splash][fields][0]", "name");
  productParams.set("populate[custom_circle][fields][0]", "name");
  productParams.set(
    "populate[custom_circle][populate][images][fields][0]",
    "url",
  );
  productParams.set(
    "populate[custom_circle][populate][images][fields][1]",
    "formats",
  );
  productParams.set("populate[taste][populate][main][fields][0]", "url");
  productParams.set("populate[taste][populate][main][fields][1]", "formats");
  productParams.set("populate[taste][populate][default_splash][fields][0]", "name");
  productParams.set("populate[taste][populate][default_circle][fields][0]", "name");
  productParams.set("populate[components][fields][0]", "name");
  productParams.set("populate[components][fields][1]", "unit");
  productParams.set("populate[components][fields][2]", "default_value");
  productParams.set("populate[nutrition]", "*");
  productParams.set("populate[dosage]", "*");
  productParams.set("populate[author][fields][0]", "username");
  productParams.set("populate[product_line][fields][0]", "name");
  productParams.set(
    "populate[product_line][populate][brands][fields][0]",
    "name",
  );
  productParams.set("sort[0]", "name:ASC");
  productParams.set("pagination[pageSize]", "1000");

  const editingProductParams = new URLSearchParams(productParams);
  editingProductParams.delete("filters[author][username][$eq]");
  editingProductParams.set("filters[id][$eq]", requestedProductId);
  editingProductParams.set(
    "filters[author][id][$eq]",
    String(result.session.user.id),
  );

  const splashParams = new URLSearchParams();
  splashParams.set("fields[0]", "name");
  splashParams.set("fields[1]", "color");
  splashParams.set("fields[2]", "isEmpty");
  splashParams.set("sort[0]", "name:ASC");
  splashParams.set("pagination[pageSize]", "1000");

  const circleParams = new URLSearchParams();
  circleParams.set("fields[0]", "name");
  circleParams.set("populate[images][fields][0]", "url");
  circleParams.set("populate[images][fields][1]", "formats");
  circleParams.set("sort[0]", "name:ASC");
  circleParams.set("pagination[pageSize]", "1000");

  const tasteParams = new URLSearchParams();
  tasteParams.set("fields[0]", "name");
  tasteParams.set("populate[main][fields][0]", "url");
  tasteParams.set("populate[main][fields][1]", "formats");
  tasteParams.set("sort[0]", "name:ASC");
  tasteParams.set("pagination[pageSize]", "1000");

  const componentParams = new URLSearchParams();
  componentParams.set("fields[0]", "name");
  componentParams.set("fields[1]", "unit");
  componentParams.set("fields[2]", "default_value");
  componentParams.set("sort[0]", "name:ASC");
  componentParams.set("pagination[pageSize]", "1000");

  try {
    const productLines = await requestStrapiRestAsService<PortalProductLine[]>(
      `/api/product-lines?${params.toString()}`,
    );
    const productLine = productLines[0];
    if (!productLine) return { notFound: true };
    const brandIds = (productLine.brands || []).map((brand) => String(brand.id));
    brandIds.forEach((brandId, index) => {
      productParams.set(
        `filters[product_line][brands][id][$in][${index}]`,
        brandId,
      );
    });

    const [
      rootProducts,
      editingProducts,
      splashes,
      circles,
      tastes,
      components,
    ] = await Promise.all([
      brandIds.length
        ? requestStrapiRestAsService<PortalProduct[]>(
            `/api/products?${productParams.toString()}`,
          )
        : Promise.resolve([]),
      requestedProductId
        ? requestStrapiRestAsService<PortalProduct[]>(
            `/api/products?${editingProductParams.toString()}`,
          )
        : Promise.resolve([]),
      requestStrapiRestAsService<PortalSplash[]>(
        `/api/splashes?${splashParams.toString()}`,
      ),
      requestStrapiRestAsService<PortalCircle[]>(
        `/api/circles?${circleParams.toString()}`,
      ),
      requestStrapiRestAsService<PortalTaste[]>(
        `/api/tastes?${tasteParams.toString()}`,
      ),
      requestStrapiRestAsService<PortalComponent[]>(
        `/api/components?${componentParams.toString()}`,
      ),
    ]);

    const allowedBrandIds = new Set(brandIds);
    const matchingRootProducts = rootProducts.filter(
      (product) =>
        product.author?.username === "root" &&
        product.product_line?.brands?.some((brand) =>
          allowedBrandIds.has(String(brand.id)),
        ),
    );
    const templateProducts = Array.from(
      new Map(
        matchingRootProducts.map((product) => [
          product.name.trim().toLocaleLowerCase(),
          product,
        ]),
      ).values(),
    );
    const editingProduct = editingProducts[0] || null;

    return {
      props: {
        session: result.session,
        productLine,
        templateProducts,
        editingProduct,
        splashes,
        circles,
        tastes,
        components,
      },
    };
  } catch (error) {
    console.error("[products/new] product line loading failed:", error);
    return { notFound: true };
  }
};
