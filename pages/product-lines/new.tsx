import {
  Alert,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Image,
  Input,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { FormEvent, useMemo, useState } from "react";
import useSWR from "swr";
import { useSplashAnimation } from "../../components/home/Splash";
import {
  SearchableImageSelect,
  type SearchableImageOption,
} from "../../components/portal/SearchableImageSelect";
import { PortalShell } from "../../components/portal/PortalShell";
import { requirePortalSession } from "../../lib/portal/auth";
import { getMediaUrl, getSmallestMediaUrl } from "../../lib/portal/media";
import { requestStrapiRestAsService } from "../../services/server/strapiClient";
import type {
  PortalBrand,
  PortalCup,
  PortalProductLine,
  PortalSession,
  PortalSplash,
} from "../../types/portal";

type NewProductLinePageProps = {
  session: PortalSession;
  rootProductLines: PortalProductLine[];
  cups: PortalCup[];
  brands: PortalBrand[];
  splashes: PortalSplash[];
  loadError?: string;
};

const toOptions = <T extends { id: string | number; name: string }>(
  items: T[],
  getImage: (item: T) => string,
): SearchableImageOption[] =>
  items.map((item) => ({
    id: String(item.id),
    name: item.name,
    imageUrl: getImage(item),
  }));

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.message || "Request failed.");
  return payload as T;
};

export default function NewProductLinePage({
  session,
  rootProductLines,
  cups,
  brands,
  splashes,
  loadError,
}: NewProductLinePageProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [baseProductLineId, setBaseProductLineId] = useState("");
  const [cupId, setCupId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [customSplashId, setCustomSplashId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const baseOptions = useMemo(
    () => toOptions(rootProductLines, () => ""),
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
        name: splash.name,
        color: splash.color || "transparent",
      })),
    [splashes],
  );
  const selectedCup = cups.find((cup) => String(cup.id) === cupId);
  const selectedBrand = brands.find((brand) => String(brand.id) === brandId);
  const selectedBaseLine = rootProductLines.find(
    (line) => String(line.id) === baseProductLineId,
  );
  const { data: customSplashResponse, error: customSplashError, isLoading: isCustomSplashLoading } =
    useSWR<{ splash: PortalSplash }>(
      customSplashId ? `/api/portal/splashes/${customSplashId}` : null,
      fetcher,
    );
  const defaultSplashFrames = useMemo(
    () =>
      selectedCup?.default_splash?.images
        ?.map((image) => getMediaUrl(image))
        .filter(Boolean) || [],
    [selectedCup],
  );
  const customSplashFrames = useMemo(
    () =>
      customSplashResponse?.splash.images
        ?.map((image) => getMediaUrl(image))
        .filter(Boolean) || [],
    [customSplashResponse],
  );
  const splashFrames = customSplashId ? customSplashFrames : defaultSplashFrames;
  const splashSets = useMemo(
    () => (splashFrames.length ? [splashFrames] : []),
    [splashFrames],
  );
  const { activeFrame, isFading } = useSplashAnimation(
    splashSets,
    Boolean(selectedCup),
  );
  const cupImage = getMediaUrl(selectedCup?.image);
  const brandImage = getSmallestMediaUrl(selectedBrand?.logo);
  const canSubmit = Boolean(
    name.trim().length >= 2 && baseProductLineId && cupId && brandId && !loadError,
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/portal/product-lines", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          baseProductLineId,
          cupId,
          brandId,
          customSplashId,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || "Product line could not be created.");
      }
      await router.push("/product-lines");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Product line could not be created.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PortalShell
      title="New product line"
      description="Choose the base line, cup, and brand. The cup animation updates as you make your selection."
      clientName={session.client.company}
      access={session.access}
    >
      {loadError ? (
        <Alert status="error" borderRadius="xl" mb="6">
          <AlertIcon />
          {loadError}
        </Alert>
      ) : null}

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: "6", lg: "8" }} alignItems="stretch">
        <Box
          as="form"
          onSubmit={onSubmit}
          bg="bg.900"
          border="1px solid"
          borderColor="whiteAlpha.100"
          borderRadius="2xl"
          p={{ base: "5", md: "7" }}
        >
          <Stack spacing="5">
            <FormControl isRequired>
              <FormLabel>Name</FormLabel>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={2}
                maxLength={100}
                placeholder="My product line"
                bg="bg.800"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Custom splash</FormLabel>
              <SearchableImageSelect
                ariaLabel="Select a custom splash"
                emptyLabel="No empty splashes found"
                options={splashOptions}
                placeholder="Use the cup default splash"
                value={customSplashId}
                onChange={setCustomSplashId}
                clearLabel="Use the cup default splash"
              />
              <FormHelperText>Only splashes marked as empty are available.</FormHelperText>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Base product line</FormLabel>
              <SearchableImageSelect
                ariaLabel="Select a root product line"
                emptyLabel="No root product lines found"
                options={baseOptions}
                placeholder="Select a product line"
                value={baseProductLineId}
                onChange={setBaseProductLineId}
              />
              <FormHelperText>Only product lines authored by root are available.</FormHelperText>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Cup</FormLabel>
              <SearchableImageSelect
                ariaLabel="Select a cup"
                emptyLabel="No cups found"
                options={cupOptions}
                placeholder="Select a cup"
                value={cupId}
                onChange={setCupId}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Brand</FormLabel>
              <SearchableImageSelect
                ariaLabel="Select a brand"
                emptyLabel="No brands found"
                options={brandOptions}
                placeholder="Select a brand"
                value={brandId}
                onChange={setBrandId}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Author</FormLabel>
              <Input
                value={session.user.username || session.user.email}
                isReadOnly
                bg="whiteAlpha.50"
                color="bg.300"
              />
            </FormControl>

            {error ? (
              <Alert status="error" borderRadius="xl">
                <AlertIcon />
                {error}
              </Alert>
            ) : null}

            <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting} isDisabled={!canSubmit}>
              Create product line
            </Button>
          </Stack>
        </Box>

        <Box
          bgGradient="linear(to-br, bg.900, bg.800)"
          border="1px solid"
          borderColor="whiteAlpha.100"
          borderRadius="2xl"
          minH={{ base: "430px", lg: "620px" }}
          p={{ base: "5", md: "7" }}
          overflow="hidden"
          position="relative"
        >
          <Stack spacing="1" position="relative" zIndex="5">
            <Text color="acid.300" fontSize="sm" fontWeight="800" letterSpacing="0.08em" textTransform="uppercase">
              Live preview
            </Text>
            <Text color="bg.50" fontSize="2xl" fontWeight="800" noOfLines={1}>
              {name || selectedBaseLine?.name || "Your product line"}
            </Text>
            {selectedBaseLine ? <Text color="bg.300">Based on {selectedBaseLine.name}</Text> : null}
          </Stack>

          {selectedBrand ? (
            <Stack direction="row" align="center" spacing="2" position="absolute" right="7" top="7" zIndex="6">
              {brandImage ? <Image src={brandImage} alt="" boxSize="34px" objectFit="contain" /> : null}
              <Text color="bg.100" fontWeight="700">{selectedBrand.name}</Text>
            </Stack>
          ) : null}

          {customSplashId && isCustomSplashLoading ? (
            <Text position="absolute" left="7" top="28" zIndex="6" color="bg.300" fontSize="sm">
              Loading custom splash…
            </Text>
          ) : null}
          {customSplashId && customSplashError ? (
            <Text position="absolute" left="7" top="28" zIndex="6" color="red.300" fontSize="sm">
              Custom splash could not be loaded.
            </Text>
          ) : null}

          <Box
            aria-label={selectedCup ? `${selectedCup.name} with animated splash` : "Cup preview"}
            role="img"
            position="absolute"
            left="50%"
            bottom={{ base: "4", md: "8" }}
            transform="translateX(-50%)"
            w={{ base: "88%", md: "78%" }}
            maxW="520px"
            aspectRatio="1"
          >
            {activeFrame ? (
              <Box
                as="img"
                src={activeFrame}
                alt=""
                draggable={false}
                position="absolute"
                zIndex="1"
                left="50%"
                top="-16%"
                w="78%"
                h="78%"
                transform="translateX(-50%)"
                objectFit="contain"
                opacity={isFading ? 0 : 1}
                transition="opacity 0.2s ease"
                pointerEvents="none"
              />
            ) : null}
            {cupImage ? (
              <Box
                as="img"
                src={cupImage}
                alt={selectedCup?.name || "Selected cup"}
                draggable={false}
                position="absolute"
                inset="0"
                zIndex="2"
                w="100%"
                h="100%"
                objectFit="contain"
                filter="drop-shadow(0 24px 40px rgba(0, 0, 0, 0.35))"
              />
            ) : (
              <Stack h="full" align="center" justify="center" color="bg.400" textAlign="center">
                <Text fontSize="6xl">+</Text>
                <Text>Select a cup to start the animation</Text>
              </Stack>
            )}
          </Box>
        </Box>
      </SimpleGrid>
    </PortalShell>
  );
}

export const getServerSideProps: GetServerSideProps<NewProductLinePageProps> = async (
  context,
) => {
  const result = await requirePortalSession(context);
  if ("redirect" in result) return { redirect: result.redirect };

  const rootParams = new URLSearchParams();
  rootParams.set("filters[author][username][$eq]", "root");
  rootParams.set("populate[0]", "author");
  rootParams.set("sort[0]", "name:ASC");
  rootParams.set("pagination[pageSize]", "100");

  const cupParams = new URLSearchParams();
  cupParams.set("populate[image][fields][0]", "url");
  cupParams.set("populate[image][fields][1]", "formats");
  cupParams.set("populate[default_splash][fields][0]", "name");
  cupParams.set("populate[default_splash][populate][images][fields][0]", "url");
  cupParams.set("populate[default_splash][populate][images][fields][1]", "formats");
  cupParams.set("sort[0]", "name:ASC");
  cupParams.set("pagination[pageSize]", "100");

  const brandParams = new URLSearchParams();
  brandParams.set("populate[logo][fields][0]", "url");
  brandParams.set("populate[logo][fields][1]", "formats");
  brandParams.set("sort[0]", "name:ASC");
  brandParams.set("pagination[pageSize]", "100");

  const splashParams = new URLSearchParams();
  splashParams.set("filters[isEmpty][$eq]", "true");
  splashParams.set("fields[0]", "name");
  splashParams.set("fields[1]", "color");
  splashParams.set("fields[2]", "isEmpty");
  splashParams.set("sort[0]", "name:ASC");
  splashParams.set("pagination[pageSize]", "100");

  try {
    const [rootProductLines, cups, brands, splashes] = await Promise.all([
      requestStrapiRestAsService<PortalProductLine[]>(
        `/api/product-lines?${rootParams.toString()}`,
      ),
      requestStrapiRestAsService<PortalCup[]>(`/api/cups?${cupParams.toString()}`),
      requestStrapiRestAsService<PortalBrand[]>(`/api/brands?${brandParams.toString()}`),
      requestStrapiRestAsService<PortalSplash[]>(
        `/api/splashes?${splashParams.toString()}`,
      ),
    ]);
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
