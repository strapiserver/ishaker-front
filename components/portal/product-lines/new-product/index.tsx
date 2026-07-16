import {
  Button,
  HStack,
  Link,
  SimpleGrid,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { capitalizeName } from "../../../../lib/formatName";
import { getMediaUrl, getSmallestMediaUrl } from "../../../../lib/portal/media";
import { getStrapiBaseUrl } from "../../../../services/fetchers";
import type {
  PortalCircle,
  PortalComponent,
  PortalProduct,
  PortalProductLine,
  PortalProductPurpose,
  PortalProductType,
  PortalSession,
  PortalSplash,
  PortalTaste,
} from "../../../../types/portal";
import { PortalShell } from "../../PortalShell";
import {
  type ProductComponentRow,
  type ProductDosageValue,
} from "./ProductComponentsTable";
import { type ProductNameOption } from "./ProductNameSelect";
import { type SearchableImageOption } from "../SearchableImageSelect";
import { NewProductForm } from "./NewProductForm";
import { NewProductSelectionDialogs } from "./NewProductSelectionDialogs";
import { NewProductVisualPreview } from "./NewProductVisualPreview";

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.message || "Request failed.");
  return payload as T;
};

const toAbsoluteUrl = (url?: string) => {
  if (!url) return "";
  return url.startsWith("http") ? url : `${getStrapiBaseUrl()}${url}`;
};

const sortFramesByName = <T extends { name?: string; url?: string }>(
  frames: T[] = [],
) =>
  [...frames].sort((left, right) =>
    (left.name || left.url || "").localeCompare(
      right.name || right.url || "",
      undefined,
      { numeric: true, sensitivity: "base" },
    ),
  );

const DEFAULT_DOSAGE: ProductDosageValue = {
  drinkVolume: "300",
  fullDrinkPrice: "",
  smallDrinkVolume: "",
  smallDrinkPrice: "",
  water: "270",
  product: "30",
  conversionFactor: "4",
};

const componentUnits = new Set(["mg", "g", "mcg", "kJ", "kcal"]);
const NEW_PRODUCT_FORM_ID = "new-product-form";

const toDosageValue = (product?: PortalProduct): ProductDosageValue => ({
  drinkVolume:
    product?.dosage?.full_drink_volume !== undefined &&
    product.dosage.full_drink_volume !== null
      ? String(product.dosage.full_drink_volume)
      : DEFAULT_DOSAGE.drinkVolume,
  fullDrinkPrice:
    product?.dosage?.full_drink_price !== undefined &&
    product.dosage.full_drink_price !== null
      ? String(product.dosage.full_drink_price)
      : DEFAULT_DOSAGE.fullDrinkPrice,
  smallDrinkVolume:
    product?.dosage?.small_drink_volume !== undefined &&
    product.dosage.small_drink_volume !== null
      ? String(product.dosage.small_drink_volume)
      : DEFAULT_DOSAGE.smallDrinkVolume,
  smallDrinkPrice:
    product?.dosage?.small_drink_price !== undefined &&
    product.dosage.small_drink_price !== null
      ? String(product.dosage.small_drink_price)
      : DEFAULT_DOSAGE.smallDrinkPrice,
  water:
    product?.dosage?.water !== undefined && product.dosage.water !== null
      ? String(product.dosage.water)
      : DEFAULT_DOSAGE.water,
  product:
    product?.dosage?.product !== undefined && product.dosage.product !== null
      ? String(product.dosage.product)
      : DEFAULT_DOSAGE.product,
  conversionFactor:
    product?.dosage?.conversion_factor !== undefined &&
    product.dosage.conversion_factor !== null
      ? String(product.dosage.conversion_factor)
      : DEFAULT_DOSAGE.conversionFactor,
});

const toComponentRows = (product?: PortalProduct): ProductComponentRow[] => {
  if (!product) return [];
  const productComponents = product.components || [];
  const componentsByName = new Map(
    productComponents.map((component) => [
      component.name.trim().toLocaleLowerCase(),
      component,
    ]),
  );

  if (product.nutrition?.length) {
    return product.nutrition.map((fact, index) => {
      const component = componentsByName.get(
        fact.name.trim().toLocaleLowerCase(),
      );
      const unit = componentUnits.has(fact.unit || "")
        ? fact.unit!
        : component?.unit || "g";
      return {
        id: `selected-component-${product.id}-${index}`,
        componentId: component ? String(component.id) : "",
        isCustom: !component,
        name: fact.name,
        quantity: String(fact.qty),
        unit,
      };
    });
  }

  return productComponents.map((component, index) => ({
    id: `selected-component-${product.id}-${index}`,
    componentId: String(component.id),
    isCustom: false,
    name: component.name,
    quantity:
      component.default_value !== undefined && component.default_value !== null
        ? String(component.default_value)
        : "",
    unit: component.unit || "g",
  }));
};

export type NewProductPageProps = {
  circles: PortalCircle[];
  components: PortalComponent[];
  initialProductId?: string;
  productLine: PortalProductLine;
  products: PortalProduct[];
  session: PortalSession;
  splashes: PortalSplash[];
  tastes: PortalTaste[];
};

export function NewProductPage({
  circles,
  components,
  initialProductId = "",
  productLine,
  products,
  session,
  splashes,
  tastes,
}: NewProductPageProps) {
  const router = useRouter();
  const toast = useToast();
  const splashDialog = useDisclosure();
  const tasteMainDialog = useDisclosure();
  const initialProduct = products.find(
    (product) => String(product.id) === initialProductId,
  );
  const isEditing = Boolean(initialProduct);
  const [name, setName] = useState(
    initialProduct ? capitalizeName(initialProduct.name) : "",
  );
  const [existingProductId, setExistingProductId] = useState(
    initialProduct ? String(initialProduct.id) : "",
  );
  const [splashId, setSplashId] = useState(
    initialProduct?.custom_splash?.id
      ? String(initialProduct.custom_splash.id)
      : initialProduct?.taste?.default_splash?.id
        ? String(initialProduct.taste.default_splash.id)
        : "",
  );
  const [circleId, setCircleId] = useState(
    initialProduct?.custom_circle?.id
      ? String(initialProduct.custom_circle.id)
      : initialProduct?.taste?.default_circle?.id
        ? String(initialProduct.taste.default_circle.id)
        : "",
  );
  const [mainImageId, setMainImageId] = useState(
    initialProduct?.custom_main?.id
      ? String(initialProduct.custom_main.id)
      : initialProduct?.taste?.main?.id
        ? String(initialProduct.taste.main.id)
        : "",
  );
  const [componentRows, setComponentRows] = useState<ProductComponentRow[]>(
    toComponentRows(initialProduct),
  );
  const [dosage, setDosage] = useState<ProductDosageValue>(
    toDosageValue(initialProduct),
  );
  const [description, setDescription] = useState(
    initialProduct?.description || "",
  );
  const [productType, setProductType] = useState<PortalProductType>(
    initialProduct?.product_type === "concentrate" ? "concentrate" : "powder",
  );
  const [productPurpose, setProductPurpose] = useState<PortalProductPurpose>(
    initialProduct?.product_purpose === "milkshake"
      ? "milkshake"
      : "sport nutrition",
  );
  const [servingQuantity, setServingQuantity] = useState(
    initialProduct?.serving_qty !== undefined &&
      initialProduct.serving_qty !== null
      ? String(initialProduct.serving_qty)
      : "100",
  );
  const [servingUnit, setServingUnit] = useState<"g" | "ml">(
    initialProduct?.serving_unit === "ml" ? "ml" : "g",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const hydratedProductDetailsId = useRef(
    initialProduct?.components !== undefined &&
      initialProduct.dosage !== undefined
      ? String(initialProduct.id)
      : "",
  );
  const productLineName = capitalizeName(productLine.name);
  const selectedProduct = products.find(
    (product) => String(product.id) === existingProductId,
  );
  const {
    data: selectedProductResponse,
    error: selectedProductError,
    isLoading: isSelectedProductLoading,
  } = useSWR<{ product: PortalProduct }>(
    existingProductId ? `/api/portal/products/${existingProductId}` : null,
    fetcher,
  );
  const {
    data: selectedSplashResponse,
    error: selectedSplashError,
    isLoading: isSelectedSplashLoading,
  } = useSWR<{ splash: PortalSplash }>(
    splashId ? `/api/portal/splashes/${splashId}` : null,
    fetcher,
  );
  const previewProduct = selectedProductResponse?.product || selectedProduct;

  useEffect(() => {
    const product = selectedProductResponse?.product;
    const taste = product?.taste;
    if (!existingProductId || !product) return;

    if (hydratedProductDetailsId.current !== existingProductId) {
      setComponentRows(toComponentRows(product));
      setDosage(toDosageValue(product));
      hydratedProductDetailsId.current = existingProductId;
    }

    setSplashId(
      (current) =>
        current ||
        (product.custom_splash?.id
          ? String(product.custom_splash.id)
          : taste?.default_splash?.id
            ? String(taste.default_splash.id)
            : ""),
    );
    setCircleId(
      (current) =>
        current ||
        (product.custom_circle?.id
          ? String(product.custom_circle.id)
          : taste?.default_circle?.id
            ? String(taste.default_circle.id)
            : ""),
    );
    setMainImageId(
      (current) =>
        current ||
        (product.custom_main?.id
          ? String(product.custom_main.id)
          : taste?.main?.id
            ? String(taste.main.id)
            : ""),
    );
  }, [existingProductId, selectedProductResponse]);

  const productOptions: ProductNameOption[] = products.map((product) => ({
    id: String(product.id),
    name: capitalizeName(product.name),
    imageUrl: product.taste?.main?.url
      ? toAbsoluteUrl(product.taste.main.url)
      : "",
  }));
  const splashOptions: SearchableImageOption[] = splashes.map((splash) => ({
    id: String(splash.id),
    name: capitalizeName(splash.name),
    color: splash.color || "transparent",
    ...(splash.isEmpty ? { badge: "Empty", badgeColorScheme: "gray" } : {}),
  }));
  const circleOptions: SearchableImageOption[] = circles.map((circle) => ({
    id: String(circle.id),
    name: capitalizeName(circle.name || `Circle ${circle.id}`),
    imageUrl: getSmallestMediaUrl(circle.images?.[0]),
  }));
  const mainImageOptions: SearchableImageOption[] = tastes
    .filter((taste) => Boolean(taste.main?.id))
    .map((taste) => ({
      id: String(taste.main!.id),
      name: capitalizeName(taste.name),
      imageUrl: getSmallestMediaUrl(taste.main),
    }));
  const splashFrames = useMemo(() => {
    const selectedFrames = sortFramesByName(
      selectedSplashResponse?.splash.images,
    )
      .map((image) => getMediaUrl(image))
      .filter(Boolean);
    if (selectedFrames.length) return selectedFrames;

    return sortFramesByName(previewProduct?.taste?.default_splash?.images)
      .map((image) => toAbsoluteUrl(image.url))
      .filter(Boolean);
  }, [previewProduct, selectedSplashResponse]);
  const selectedSplash = splashes.find(
    (splash) => String(splash.id) === splashId,
  );
  const selectedCircle = circles.find(
    (circle) => String(circle.id) === circleId,
  );
  const selectedMain = tastes.find(
    (taste) => String(taste.main?.id) === mainImageId,
  )?.main;
  const canSubmit =
    name.trim().length >= 2 &&
    Boolean(splashId) &&
    Boolean(circleId) &&
    Boolean(mainImageId) &&
    componentRows.length <= 50 &&
    componentRows.every(
      (row) =>
        Boolean(row.name.trim()) &&
        (Boolean(row.componentId) || row.isCustom) &&
        Boolean(row.unit) &&
        Number(row.quantity) > 0,
    ) &&
    Number(servingQuantity) > 0 &&
    Number(dosage.drinkVolume) > 0 &&
    (dosage.fullDrinkPrice === "" || Number(dosage.fullDrinkPrice) >= 0) &&
    (dosage.smallDrinkVolume === "" ||
      (Number(dosage.smallDrinkVolume) >= 100 &&
        Number(dosage.smallDrinkVolume) < Number(dosage.drinkVolume))) &&
    (dosage.smallDrinkPrice === "" || Number(dosage.smallDrinkPrice) >= 0) &&
    Number(dosage.water) >= 50 &&
    Number(dosage.water) <= 500 &&
    Number(dosage.product) > 0 &&
    Number(dosage.water) + Number(dosage.product) <=
      Number(dosage.drinkVolume) &&
    Number(dosage.conversionFactor) > 0;

  const resetProductVisuals = () => {
    setExistingProductId("");
    setSplashId("");
    setCircleId("");
    setMainImageId("");
  };
  const selectProduct = (product: ProductNameOption) => {
    setName(product.name);
    setExistingProductId(product.id);
    const selected = products.find((item) => String(item.id) === product.id);
    hydratedProductDetailsId.current =
      selected?.components !== undefined && selected.dosage !== undefined
        ? product.id
        : "";
    setDescription(selected?.description || "");
    setProductType(
      selected?.product_type === "concentrate" ? "concentrate" : "powder",
    );
    setProductPurpose(
      selected?.product_purpose === "milkshake"
        ? "milkshake"
        : "sport nutrition",
    );
    setServingQuantity(
      selected?.serving_qty !== undefined && selected?.serving_qty !== null
        ? String(selected.serving_qty)
        : "100",
    );
    setServingUnit(selected?.serving_unit === "ml" ? "ml" : "g");
    setComponentRows(toComponentRows(selected));
    setDosage(toDosageValue(selected));
    setSplashId(
      selected?.custom_splash?.id
        ? String(selected.custom_splash.id)
        : selected?.taste?.default_splash?.id
          ? String(selected.taste.default_splash.id)
          : "",
    );
    setCircleId(
      selected?.custom_circle?.id
        ? String(selected.custom_circle.id)
        : selected?.taste?.default_circle?.id
          ? String(selected.taste.default_circle.id)
          : "",
    );
    setMainImageId(
      selected?.custom_main?.id
        ? String(selected.custom_main.id)
        : selected?.taste?.main?.id
          ? String(selected.taste.main.id)
          : "",
    );
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch(
        `/api/portal/product-lines/${productLine.id}/products`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: capitalizeName(name),
            existingProductId,
            isEditing,
            splashId,
            circleId,
            mainImageId,
            components: componentRows.map(
              ({
                componentId,
                isCustom,
                name: componentName,
                quantity,
                unit,
              }) => ({
                componentId,
                isCustom,
                name: componentName,
                quantity: Number(quantity),
                unit,
              }),
            ),
            description,
            productType,
            productPurpose,
            servingQty: Number(servingQuantity),
            servingUnit,
            dosage: {
              fullDrinkVolume: Number(dosage.drinkVolume),
              fullDrinkPrice:
                dosage.fullDrinkPrice === ""
                  ? null
                  : Number(dosage.fullDrinkPrice),
              smallDrinkVolume:
                dosage.smallDrinkVolume === ""
                  ? null
                  : Number(dosage.smallDrinkVolume),
              smallDrinkPrice:
                dosage.smallDrinkPrice === ""
                  ? null
                  : Number(dosage.smallDrinkPrice),
              water: Number(dosage.water),
              product: Number(dosage.product),
              conversionFactor: Number(dosage.conversionFactor),
            },
          }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || "Product could not be created.");
      }
      toast({
        title: "Product saved",
        description: "Updates will take place on machine in 5 minutes.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      await router.push("/product-lines");
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : "Product could not be saved.";
      setError(message);
      toast({
        title: "Product save failed",
        description: message,
        status: "error",
        duration: 7000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PortalShell
      title={isEditing ? "Edit product" : "New product"}
      description={`Edit what customers will see as one of ${productLineName} product line items (flavors).`}
      clientName={session.client.company}
      access={session.access}
    >
      <SimpleGrid
        columns={{ base: 1, lg: 2 }}
        spacing={{ base: "6", lg: "8" }}
        alignItems="stretch"
      >
        <NewProductForm
          componentRows={componentRows}
          components={components}
          description={description}
          dosage={dosage}
          error={error}
          formId={NEW_PRODUCT_FORM_ID}
          mainImageId={mainImageId}
          mainImageOptions={mainImageOptions}
          name={name}
          onComponentRowsChange={setComponentRows}
          onCreateCustomProduct={resetProductVisuals}
          onDescriptionChange={setDescription}
          onDosageChange={setDosage}
          onNameChange={(value) => {
            setName(value);
            if (!isEditing) resetProductVisuals();
          }}
          onProductSelect={selectProduct}
          onProductPurposeChange={setProductPurpose}
          onProductTypeChange={setProductType}
          onServingQuantityChange={setServingQuantity}
          onServingUnitChange={setServingUnit}
          onShowMoreMainImages={tasteMainDialog.onOpen}
          onShowMoreSplashes={splashDialog.onOpen}
          onSubmit={submit}
          onVisualChange={{
            splash: setSplashId,
            circle: setCircleId,
            mainImage: setMainImageId,
          }}
          productLineName={productLineName}
          productOptions={productOptions}
          productPurpose={productPurpose}
          productType={productType}
          servingQuantity={servingQuantity}
          servingUnit={servingUnit}
          splashId={splashId}
          splashOptions={splashOptions}
          circleId={circleId}
          circleOptions={circleOptions}
        />
        <NewProductVisualPreview
          brand={productLine.brands?.[0]}
          circle={selectedCircle}
          cup={productLine.cup || undefined}
          isSplashLoading={Boolean(
            (existingProductId && isSelectedProductLoading) ||
            (splashId && isSelectedSplashLoading),
          )}
          main={selectedMain}
          productLineName={name || previewProduct?.name || productLineName}
          splashError={Boolean(
            (existingProductId && selectedProductError) ||
            (splashId && selectedSplashError),
          )}
          splashFrames={splashFrames}
          splashIsEmpty={
            selectedSplashResponse?.splash.isEmpty ?? selectedSplash?.isEmpty
          }
        />
      </SimpleGrid>

      <NewProductSelectionDialogs
        isMainImageOpen={tasteMainDialog.isOpen}
        isSplashOpen={splashDialog.isOpen}
        mainImageId={mainImageId}
        onCloseMainImage={tasteMainDialog.onClose}
        onCloseSplash={splashDialog.onClose}
        onSelectMainImage={(id) => {
          setMainImageId(id);
          tasteMainDialog.onClose();
        }}
        onSelectSplash={(id) => {
          setSplashId(id);
          splashDialog.onClose();
        }}
        splashId={splashId}
        splashes={splashes}
        tastes={tastes}
      />
      <HStack spacing="3" mt="4" justify="flex-start">
        <Button
          type="submit"
          form={NEW_PRODUCT_FORM_ID}
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          isDisabled={!canSubmit}
        >
          Save product
        </Button>
        <Button as={Link} href="/product-lines" size="lg" variant="ghost">
          Cancel
        </Button>
      </HStack>
    </PortalShell>
  );
}

export { NewProductForm } from "./NewProductForm";
export { NewProductSelectionDialogs } from "./NewProductSelectionDialogs";
export { NewProductVisualPreview } from "./NewProductVisualPreview";
