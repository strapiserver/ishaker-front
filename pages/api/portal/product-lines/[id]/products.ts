import type { NextApiRequest, NextApiResponse } from "next";
import { capitalizeName } from "../../../../../lib/formatName";
import { getPortalSessionFromApiRequest } from "../../../../../lib/portal/auth";
import { requestStrapiRestAsService } from "../../../../../services/server/strapiClient";
import type { PortalProductLine } from "../../../../../types/portal";

type CreatedProduct = {
  id: string | number;
  name: string;
};

type RelatedEntity = {
  id: string | number;
};

type CatalogComponent = {
  id: string | number;
  name: string;
  unit?: "mg" | "g" | "mcg" | "kJ" | "kcal";
};

type SubmittedComponent = {
  componentId: string;
  isCustom: boolean;
  name: string;
  quantity: number;
  unit: "mg" | "g" | "mcg" | "kJ" | "kcal";
};

type SubmittedDosage = {
  full_drink_volume: number;
  full_drink_price: number | null;
  small_drink_volume: number | null;
  small_drink_price: number | null;
  water: number;
  product: number;
  conversion_factor: number;
};

const componentUnits = new Set(["mg", "g", "mcg", "kJ", "kcal"]);

const asString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const asId = (value: unknown) => {
  const id = asString(value);
  return /^\d+$/.test(id) ? id : "";
};

const optionalAmount = (value: unknown, allowZero = false) => {
  if (value === null || value === undefined || value === "") return null;
  const amount = Number(value);
  return Number.isFinite(amount) && (allowZero ? amount >= 0 : amount > 0)
    ? amount
    : undefined;
};

const parseDosage = (value: unknown): SubmittedDosage | null => {
  if (!value || typeof value !== "object") return null;
  const dosage = value as Record<string, unknown>;
  const fullDrinkVolume = Number(dosage.fullDrinkVolume);
  const fullDrinkPrice = optionalAmount(dosage.fullDrinkPrice, true);
  const smallDrinkVolume = optionalAmount(dosage.smallDrinkVolume);
  const smallDrinkPrice = optionalAmount(dosage.smallDrinkPrice, true);
  const water = Number(dosage.water);
  const product = Number(dosage.product);
  const conversionFactor = Number(dosage.conversionFactor);
  if (
    ![fullDrinkVolume, water, product, conversionFactor].every(
      (amount) => Number.isFinite(amount) && amount > 0,
    ) ||
    fullDrinkPrice === undefined ||
    smallDrinkVolume === undefined ||
    smallDrinkPrice === undefined
  ) {
    return null;
  }
  return {
    full_drink_volume: fullDrinkVolume,
    full_drink_price: fullDrinkPrice,
    small_drink_volume: smallDrinkVolume,
    small_drink_price: smallDrinkPrice,
    water,
    product,
    conversion_factor: conversionFactor,
  };
};

const parseComponents = (value: unknown): SubmittedComponent[] | null => {
  if (!Array.isArray(value) || value.length > 50) return null;

  const components = value.map((item) => {
    const component = item && typeof item === "object" ? item : {};
    const componentId = asId((component as { componentId?: unknown }).componentId);
    const isCustom = (component as { isCustom?: unknown }).isCustom === true;
    const name = capitalizeName(asString((component as { name?: unknown }).name));
    const quantity = Number((component as { quantity?: unknown }).quantity);
    const unit = asString((component as { unit?: unknown }).unit);
    return { componentId, isCustom, name, quantity, unit };
  });

  if (
    components.some(
      (component) =>
        (!component.componentId && !component.isCustom) ||
        (!component.componentId && (component.name.length < 2 || component.name.length > 100)) ||
        !Number.isFinite(component.quantity) ||
        component.quantity <= 0 ||
        !componentUnits.has(component.unit),
    )
  ) {
    return null;
  }

  const keys = new Set(
    components.map((component) =>
      component.componentId
        ? `id:${component.componentId}`
        : `name:${component.name.toLocaleLowerCase()}`,
    ),
  );
  return keys.size === components.length
    ? (components as SubmittedComponent[])
    : null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const session = await getPortalSessionFromApiRequest(req);
  if (!session) return res.status(401).json({ error: "unauthorized" });

  const productLineId = asId(Array.isArray(req.query.id) ? req.query.id[0] : req.query.id);
  const existingProductId = asId(req.body?.existingProductId);
  const isEditing = req.body?.isEditing === true;
  const splashId = asId(req.body?.splashId);
  const circleId = asId(req.body?.circleId);
  const mainImageId = asId(req.body?.mainImageId);
  const submittedComponents = parseComponents(req.body?.components);
  const submittedDosage = parseDosage(req.body?.dosage);
  const name = capitalizeName(asString(req.body?.name));
  const description = asString(req.body?.description);
  const productType = asString(req.body?.productType);
  const productPurpose = asString(req.body?.productPurpose);
  const servingUnit = asString(req.body?.servingUnit);
  const servingQty = Number(req.body?.servingQty);

  if (!productLineId) {
    return res.status(400).json({ error: "invalid_product_line" });
  }
  if (!splashId || !circleId || !mainImageId) {
    return res.status(400).json({
      error: "invalid_visuals",
      message: "Splash, circle, and taste main image are required.",
    });
  }
  if (!submittedComponents) {
    return res.status(400).json({
      error: "invalid_components",
      message: "Components must be unique and include a positive quantity (maximum 50).",
    });
  }
  if (!submittedDosage) {
    return res.status(400).json({
      error: "invalid_dosage",
      message: "Required dosage values must be positive and prices cannot be negative.",
    });
  }
  if (
    submittedDosage.water + submittedDosage.product >
    submittedDosage.full_drink_volume
  ) {
    return res.status(400).json({
      error: "dosage_exceeds_drink_volume",
      message: "Water + Product can't exceed the drink volume.",
    });
  }
  if (
    submittedDosage.small_drink_volume !== null &&
    submittedDosage.small_drink_volume < 100
  ) {
    return res.status(400).json({
      error: "small_drink_volume_too_low",
      message: "Small drink volume must be at least 100ml.",
    });
  }
  if (submittedDosage.water < 50 || submittedDosage.water > 500) {
    return res.status(400).json({
      error: "water_out_of_range",
      message: "Water must be between 50ml and 500ml.",
    });
  }
  if (
    submittedDosage.small_drink_volume !== null &&
    submittedDosage.small_drink_volume >= submittedDosage.full_drink_volume
  ) {
    return res.status(400).json({
      error: "small_drink_volume_too_large",
      message: "Small drink volume must be less than full drink volume.",
    });
  }
  if (submittedDosage.small_drink_volume !== null) {
    const scale =
      submittedDosage.small_drink_volume /
      submittedDosage.full_drink_volume;
    const scaledContents =
      submittedDosage.water * scale + submittedDosage.product * scale;
    if (scaledContents > submittedDosage.small_drink_volume + 1e-9) {
      return res.status(400).json({
        error: "dosage_exceeds_small_drink_volume",
        message: "Water + Product can't exceed the drink volume.",
      });
    }
  }
  if (name.length < 2 || name.length > 100) {
    return res.status(400).json({
      error: "invalid_name",
      message: "Name must contain between 2 and 100 characters.",
    });
  }
  if (description.length > 2000) {
    return res.status(400).json({
      error: "invalid_description",
      message: "Description must not exceed 2000 characters.",
    });
  }
  if (!["powder", "concentrate"].includes(productType)) {
    return res.status(400).json({
      error: "invalid_product_type",
      message: "Select a valid product type.",
    });
  }
  if (!["milkshake", "sport nutrition"].includes(productPurpose)) {
    return res.status(400).json({
      error: "invalid_product_purpose",
      message: "Select a valid product purpose.",
    });
  }
  if (
    !["g", "ml"].includes(servingUnit) ||
    !Number.isFinite(servingQty) ||
    servingQty <= 0
  ) {
    return res.status(400).json({
      error: "invalid_serving",
      message: "Serving quantity and unit are invalid.",
    });
  }

  const ownershipParams = new URLSearchParams();
  ownershipParams.set("filters[id][$eq]", productLineId);
  ownershipParams.set("filters[author][id][$eq]", String(session.user.id));
  ownershipParams.set("populate[products][fields][0]", "name");
  ownershipParams.set("pagination[pageSize]", "1000");

  // Name uniqueness is PER AUTHOR (reusing a root product clones it into the
  // client's own space under the same name, so a global check would always 409).
  const duplicateNameParams = new URLSearchParams();
  duplicateNameParams.set("filters[name][$eqi]", name);
  duplicateNameParams.set("filters[author][id][$eq]", String(session.user.id));
  if (isEditing && existingProductId) {
    duplicateNameParams.set("filters[id][$ne]", existingProductId);
  }
  duplicateNameParams.set("pagination[pageSize]", "1");

  const componentParams = new URLSearchParams();
  componentParams.set("fields[0]", "name");
  componentParams.set("fields[1]", "unit");
  submittedComponents
    .filter((component) => Boolean(component.componentId))
    .forEach((component, index) => {
    componentParams.set(`filters[id][$in][${index}]`, component.componentId);
  });
  componentParams.set("pagination[pageSize]", "50");

  try {
    const productLines = await requestStrapiRestAsService<PortalProductLine[]>(
      `/api/product-lines?${ownershipParams.toString()}`,
    );
    const productLine = productLines[0];

    if (!productLine?.id) {
      return res.status(404).json({
        error: "product_line_not_found",
        message: "Product line was not found or does not belong to you.",
      });
    }
    if (
      isEditing &&
      !productLine.products?.some(
        (product) => String(product.id) === existingProductId,
      )
    ) {
      return res.status(404).json({
        error: "product_not_found",
        message: "Product was not found in this product line.",
      });
    }

    const [
      splash,
      circle,
      mainImage,
      catalogComponents,
      duplicateProducts,
    ] = await Promise.all([
      requestStrapiRestAsService<RelatedEntity>(`/api/splashes/${splashId}`),
      requestStrapiRestAsService<RelatedEntity>(`/api/circles/${circleId}`),
      requestStrapiRestAsService<RelatedEntity>(
        `/api/upload/files/${mainImageId}`,
      ),
      submittedComponents.some((component) => component.componentId)
        ? requestStrapiRestAsService<CatalogComponent[]>(
            `/api/components?${componentParams.toString()}`,
          )
        : Promise.resolve([]),
      requestStrapiRestAsService<CreatedProduct[]>(
        `/api/products?${duplicateNameParams.toString()}`,
      ),
    ]);

    if (duplicateProducts.length) {
      return res.status(409).json({
        error: "duplicate_name",
        message: "A product with this name already exists.",
      });
    }

    if (
      existingProductId &&
      !isEditing &&
      productLine.products?.some(
        (product) => String(product.id) === existingProductId,
      )
    ) {
      return res.status(409).json({
        error: "duplicate_product",
        message: "This product has already been added to the product line.",
      });
    }

    if (!splash?.id || !circle?.id || !mainImage?.id) {
      return res.status(400).json({
        error: "invalid_visuals",
        message: "The selected splash, circle, or taste main image no longer exists.",
      });
    }

    const selectedExistingComponents = submittedComponents.filter((component) =>
      Boolean(component.componentId),
    );
    if (catalogComponents.length !== selectedExistingComponents.length) {
      return res.status(400).json({
        error: "invalid_components",
        message: "One or more selected components no longer exist.",
      });
    }

    const componentsById = new Map(
      catalogComponents.map((component) => [String(component.id), component]),
    );
    const customComponents = submittedComponents.filter(
      (component) => !component.componentId,
    );
    const createdCustomComponents = await Promise.all(
      customComponents.map((component) =>
        requestStrapiRestAsService<CatalogComponent>("/api/components", {
          method: "POST",
          body: JSON.stringify({
            data: {
              name: component.name,
              unit: component.unit,
              default_value: component.quantity,
            },
          }),
        }),
      ),
    );
    const customComponentsByName = new Map(
      createdCustomComponents.map((component) => [
        component.name.toLocaleLowerCase(),
        component,
      ]),
    );
    const productComponents = submittedComponents.map((submitted) => {
      const component = submitted.componentId
        ? componentsById.get(submitted.componentId)!
        : customComponentsByName.get(submitted.name.toLocaleLowerCase())!;
      return { component, quantity: submitted.quantity, unit: submitted.unit };
    });
    const componentIds = productComponents.map(({ component }) => component.id);
    const nutrition = productComponents.map(({ component, quantity, unit }) => ({
      name: component.name,
      qty: quantity,
      unit,
    }));

    if (existingProductId && isEditing) {
      // Editing one of the user's own products in this line: update in place.
      const existingProduct = await requestStrapiRestAsService<CreatedProduct>(
        `/api/products/${existingProductId}`,
      );

      if (!existingProduct?.id) {
        return res.status(400).json({
          error: "invalid_product",
          message: "The selected product no longer exists.",
        });
      }

      await requestStrapiRestAsService(`/api/products/${existingProduct.id}`, {
        method: "PUT",
        body: JSON.stringify({
          data: {
            name,
            ...(description ? { description } : { description: null }),
            product_type: productType,
            product_purpose: productPurpose,
            serving_qty: servingQty,
            serving_unit: servingUnit,
            custom_splash: splash.id,
            custom_circle: circle.id,
            custom_main: mainImage.id,
            components: { set: componentIds },
            nutrition,
            dosage: submittedDosage,
          },
        }),
      });

      await requestStrapiRestAsService(`/api/product-lines/${productLine.id}`, {
        method: "PUT",
        body: JSON.stringify({
          data: {
            products: { connect: [existingProduct.id] },
          },
        }),
      });

      return res.status(200).json({ product: existingProduct, reused: true });
    }

    // Reusing a reference product must NOT connect it (Product.product_line is
    // many-to-one — connecting would MOVE it out of its owner's line). Instead we
    // CLONE it: a new product owned by this user, with base_product provenance.
    if (existingProductId) {
      const baseProduct = await requestStrapiRestAsService<CreatedProduct>(
        `/api/products/${existingProductId}`,
      );
      if (!baseProduct?.id) {
        return res.status(400).json({
          error: "invalid_product",
          message: "The selected product no longer exists.",
        });
      }
    }

    const product = await requestStrapiRestAsService<CreatedProduct>("/api/products", {
      method: "POST",
      body: JSON.stringify({
        data: {
          name,
          ...(description ? { description } : {}),
          product_type: productType,
          product_purpose: productPurpose,
          serving_qty: servingQty,
          serving_unit: servingUnit,
          author: session.user.id,
          ...(existingProductId ? { base_product: Number(existingProductId) } : {}),
          custom_splash: splash.id,
          custom_circle: circle.id,
          custom_main: mainImage.id,
          ...(componentIds.length ? { components: { connect: componentIds } } : {}),
          nutrition,
          dosage: submittedDosage,
        },
      }),
    });

    try {
      await requestStrapiRestAsService(`/api/product-lines/${productLine.id}`, {
        method: "PUT",
        body: JSON.stringify({
          data: {
            products: { connect: [product.id] },
          },
        }),
      });
    } catch (linkError) {
      await requestStrapiRestAsService(`/api/products/${product.id}`, {
        method: "DELETE",
      }).catch(() => undefined);
      throw linkError;
    }

    return res.status(201).json({ product });
  } catch (error) {
    console.error("[portal/product-lines/:id/products] creation failed:", error);
    const status = (error as { status?: number }).status;
    return res.status(status === 400 ? 400 : 500).json({
      error: "product_creation_failed",
      message:
        status === 400
          ? "A product with this name may already exist."
          : "Product could not be created.",
    });
  }
}
