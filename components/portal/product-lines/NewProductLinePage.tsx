import { Alert, AlertIcon, SimpleGrid, useToast } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { FormEvent, useMemo, useState } from "react";
import useSWR from "swr";
import { CupPreview } from "./CupPreview";
import { ProductLineForm } from "./ProductLineForm";
import { type SearchableImageOption } from "./SearchableImageSelect";
import { PortalShell } from "../PortalShell";
import { getMediaUrl, getSmallestMediaUrl } from "../../../lib/portal/media";
import { capitalizeName } from "../../../lib/formatName";
import type {
  PortalBrand,
  PortalCup,
  PortalProductLine,
  PortalSession,
  PortalSplash,
} from "../../../types/portal";

export type NewProductLinePageProps = {
  session: PortalSession;
  rootProductLines: PortalProductLine[];
  cups: PortalCup[];
  brands: PortalBrand[];
  splashes: PortalSplash[];
  productLine?: PortalProductLine;
  loadError?: string;
};

const toOptions = <T extends { id: string | number; name: string }>(
  items: T[],
  getImage: (item: T) => string,
): SearchableImageOption[] =>
  items.map((item) => ({
    id: String(item.id),
    name: capitalizeName(item.name),
    imageUrl: getImage(item),
  }));

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.message || "Request failed.");
  return payload as T;
};

const sortFramesByNumericName = <T extends { name?: string; url?: string }>(
  frames: T[] = [],
) =>
  [...frames].sort((left, right) =>
    (left.name || left.url || "").localeCompare(
      right.name || right.url || "",
      undefined,
      { numeric: true, sensitivity: "base" },
    ),
  );

export function NewProductLinePage({
  session,
  rootProductLines,
  cups,
  brands,
  splashes,
  productLine,
  loadError,
}: NewProductLinePageProps) {
  const router = useRouter();
  const toast = useToast();
  const isEditing = Boolean(productLine?.id);
  const [name, setName] = useState(productLine?.name || "");
  const [baseProductLineId, setBaseProductLineId] = useState(
    productLine?.base_product_line?.id
      ? String(productLine.base_product_line.id)
      : "",
  );
  const [cupId, setCupId] = useState(
    productLine?.cup?.id ? String(productLine.cup.id) : "",
  );
  const [brandId, setBrandId] = useState(
    productLine?.brands?.[0]?.id ? String(productLine.brands[0].id) : "",
  );
  const [customSplashId, setCustomSplashId] = useState(
    productLine?.custom_splash?.id ? String(productLine.custom_splash.id) : "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const baseOptions = useMemo(
    () =>
      [...rootProductLines]
        .sort(
          (left, right) =>
            Number(Boolean(right.isPopular)) -
              Number(Boolean(left.isPopular)) ||
            left.name.localeCompare(right.name, undefined, {
              sensitivity: "base",
            }),
        )
        .map((line) => ({
          id: String(line.id),
          name: capitalizeName(line.name),
          imageUrl: getSmallestMediaUrl(line.cup?.image),
          ...(line.isPopular
            ? { subtitle: "Popular", subtitleColor: "green.300" }
            : {}),
        })),
    [rootProductLines],
  );
  const cupOptions = useMemo(
    () => toOptions(cups, (cup) => getSmallestMediaUrl(cup.image)),
    [cups],
  );
  const brandOptions = useMemo(
    () => toOptions(brands, (brand) => getSmallestMediaUrl(brand.logo)),
    [brands],
  );
  const splashOptions = useMemo(
    () =>
      splashes.map((splash) => ({
        id: String(splash.id),
        name: capitalizeName(splash.name),
        color: splash.color || "transparent",
      })),
    [splashes],
  );
  const selectedCup = cups.find((cup) => String(cup.id) === cupId);
  const selectedBrand = brands.find((brand) => String(brand.id) === brandId);
  const selectedBaseLine = rootProductLines.find(
    (line) => String(line.id) === baseProductLineId,
  );
  const {
    data: customSplashResponse,
    error: customSplashError,
    isLoading: isCustomSplashLoading,
  } = useSWR<{ splash: PortalSplash }>(
    cupId && customSplashId ? `/api/portal/splashes/${customSplashId}` : null,
    fetcher,
  );
  const customSplashFrames = useMemo(
    () =>
      sortFramesByNumericName(customSplashResponse?.splash.images)
        .map((image) => getMediaUrl(image))
        .filter(Boolean) || [],
    [customSplashResponse],
  );
  const splashFrames = customSplashId ? customSplashFrames : [];
  const splashIsEmpty = customSplashId
    ? customSplashResponse?.splash.isEmpty
    : undefined;
  const canSubmit = Boolean(
    name.trim().length >= 2 &&
    baseProductLineId &&
    cupId &&
    brandId &&
    !loadError,
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch(
        isEditing
          ? `/api/portal/product-lines/${productLine?.id}`
          : "/api/portal/product-lines",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: capitalizeName(name),
            baseProductLineId,
            cupId,
            brandId,
            customSplashId,
          }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          payload?.message ||
            `Product line could not be ${isEditing ? "updated" : "created"}.`,
        );
      }
      toast({
        title: "Updates will take 5 minutes",
        description: "Check machine after that time",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      await router.push("/product-lines");
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : `Product line could not be ${isEditing ? "updated" : "created"}.`;
      setError(message);
      toast({
        title: "Product line save failed",
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
      title={isEditing ? "Edit product line" : "New product line"}
      description={`${isEditing ? "Update" : "Choose"} the base line, cup, and brand. The cup animation updates as you make your selection.`}
      clientName={session.client.company}
      access={session.access}
    >
      {loadError ? (
        <Alert status="error" borderRadius="xl" mb="6">
          <AlertIcon />
          {loadError}
        </Alert>
      ) : null}

      <SimpleGrid
        columns={{ base: 1, lg: 2 }}
        spacing={{ base: "6", lg: "8" }}
        alignItems="stretch"
      >
        <ProductLineForm
          baseOptions={baseOptions}
          baseProductLineId={baseProductLineId}
          brandId={brandId}
          brandOptions={brandOptions}
          canSubmit={canSubmit}
          cupId={cupId}
          cupOptions={cupOptions}
          customSplashId={customSplashId}
          error={error}
          isSubmitting={isSubmitting}
          onBaseProductLineChange={(value) => {
            setBaseProductLineId(value);
            const rootLine = rootProductLines.find(
              (line) => String(line.id) === value,
            );
            if (rootLine) {
              setName(capitalizeName(rootLine.name));
              setCupId(rootLine.cup?.id ? String(rootLine.cup.id) : "");
              setBrandId(
                rootLine.brands?.[0]?.id ? String(rootLine.brands[0].id) : "",
              );
              setCustomSplashId(
                rootLine.custom_splash?.id
                  ? String(rootLine.custom_splash.id)
                  : "",
              );
            }
          }}
          onBrandChange={setBrandId}
          onCupChange={(value) => {
            setCupId(value);
            setCustomSplashId("");
          }}
          onCustomSplashChange={setCustomSplashId}
          onSubmit={onSubmit}
          splashOptions={splashOptions}
          submitLabel={isEditing ? "Save changes" : "Create product line"}
        />

        <CupPreview
          brand={selectedBrand}
          cup={selectedCup}
          isSplashLoading={Boolean(customSplashId && isCustomSplashLoading)}
          productLineName={name || selectedBaseLine?.name}
          splashError={Boolean(customSplashId && customSplashError)}
          splashFrames={splashFrames}
          splashIsEmpty={splashIsEmpty}
        />
      </SimpleGrid>
    </PortalShell>
  );
}
