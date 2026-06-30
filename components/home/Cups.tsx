import { Box, Container, SimpleGrid, Stack } from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Courosel, type TasteSlide } from "./Courosel";
import CustomTitle from "./CutsomTitle";
import { useSplashAnimation } from "./Splash";

const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL || "https://admin.ishaker.xyz";
const TASTE_SOURCE_QUERY = [
  "pagination[pageSize]=50",
  "fields[0]=name",
  "fields[1]=isWebsiteVisible",
  "populate[main][fields][0]=url",
  "populate[main][fields][1]=formats",
  "populate[splash][fields][0]=url",
  "populate[splash][fields][1]=formats",
  "populate[circle][fields][0]=url",
  "populate[circle][fields][1]=formats",
].join("&");
const TASTE_SOURCE_URL = `${STRAPI_URL}/api/tastes?${TASTE_SOURCE_QUERY}`;

type StrapiMedia = {
  attributes?: {
    formats?: {
      medium?: {
        url?: string | null;
      };
      small?: {
        url?: string | null;
      };
      thumbnail?: {
        url?: string | null;
      };
    } | null;
    url?: string | null;
  };
};

type Taste = {
  attributes?: {
    circle?: {
      data?: StrapiMedia | null;
    };
    isWebsiteVisible?: boolean | null;
    main?: {
      data?: StrapiMedia | null;
    };
    name?: string | null;
    splash?: {
      data?: StrapiMedia[];
    };
  };
};

type TastesResponse = {
  data?: Taste[];
};

function normalizeMediaUrl(url?: string | null) {
  if (!url) {
    return null;
  }

  return url.startsWith("http") ? url : `${STRAPI_URL}${url}`;
}

function getMediaUrl(media?: StrapiMedia | null) {
  return normalizeMediaUrl(
    media?.attributes?.formats?.small?.url ??
      media?.attributes?.formats?.thumbnail?.url ??
      media?.attributes?.formats?.medium?.url ??
      media?.attributes?.url,
  );
}

function getSplashSet(taste: Taste) {
  return (
    taste.attributes?.splash?.data
      ?.map((frame) => getMediaUrl(frame))
      .filter((url): url is string => Boolean(url)) ?? []
  );
}

function isTasteWebsiteVisible(taste: Taste) {
  return taste.attributes?.isWebsiteVisible !== false;
}

function getTasteSlides(response: TastesResponse) {
  return (
    response.data
      ?.filter(isTasteWebsiteVisible)
      .map((taste) => {
        const circleImage = getMediaUrl(taste.attributes?.circle?.data);
        const mainImage = getMediaUrl(taste.attributes?.main?.data);
        const splashFrames = getSplashSet(taste);

        if (!circleImage || !mainImage || !splashFrames.length) {
          return null;
        }

        return {
          circleImage,
          mainImage,
          name: taste.attributes?.name ?? mainImage,
          splashFrames,
        };
      })
      .filter((taste): taste is TasteSlide => Boolean(taste)) ?? []
  );
}

export function Cups() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const fadeFrameRef = useRef<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [hasCarouselFadedIn, setHasCarouselFadedIn] = useState(false);
  const [tastes, setTastes] = useState<TasteSlide[]>([]);
  const splashes = useMemo(
    () => tastes.map((taste) => taste.splashFrames),
    [tastes],
  );
  const { activeFrame, activeIndex, isFading } = useSplashAnimation(
    splashes,
    isActive,
  );

  useEffect(() => {
    const root = rootRef.current;

    if (!root) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsActive(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.35,
      },
    );

    observer.observe(root);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTastes() {
      try {
        const response = await fetch(TASTE_SOURCE_URL, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Taste request failed with ${response.status}`);
        }

        const tastesResponse = (await response.json()) as TastesResponse;
        setTastes(getTasteSlides(tastesResponse));
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("[cups] Failed to load taste data:", error);
      }
    }

    loadTastes();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!tastes.length) {
      setHasCarouselFadedIn(false);
      return undefined;
    }

    setHasCarouselFadedIn(false);
    fadeFrameRef.current = window.requestAnimationFrame(() => {
      fadeFrameRef.current = window.requestAnimationFrame(() => {
        setHasCarouselFadedIn(true);
      });
    });

    return () => {
      if (fadeFrameRef.current !== null) {
        window.cancelAnimationFrame(fadeFrameRef.current);
      }
    };
  }, [tastes.length]);

  return (
    <Container maxW="7xl" py={{ base: "8", md: "12" }}>
      <SimpleGrid
        columns={{ base: 1, lg: 2 }}
        spacing={{ base: "4", lg: "6" }}
        alignItems="center"
      >
        <Stack
          spacing="4"
          maxW="md"
          mx={{ base: "auto", lg: "0" }}
          textAlign={{ base: "center", lg: "left" }}
          align={{ base: "center", lg: "flex-start" }}
        >
          <CustomTitle
            as="h2"
            title="20+ flavors"
            subtitle="Browse protein, BCAA, isotonic, and water mixes as the cups fill with each animated splash."
            mt="0"
            mb="0"
            textAlign={{ base: "center", lg: "left" }}
            fontSize={{ base: "3xl", md: "8xl" }}
            subtitleProps={{
              fontSize: { base: "md", md: "lg" },
              lineHeight: "1.8",
              mx: "0",
            }}
          />
        </Stack>

        <Stack
          spacing={{ base: "3", md: "4" }}
          align="center"
          justifySelf={{ base: "center", lg: "end" }}
          w="100%"
        >
          <Courosel
            activeIndex={activeIndex}
            hasLoaded={hasCarouselFadedIn}
            tastes={tastes}
          />
          <Box
            ref={rootRef}
            aria-label="iShaker cups with animated splash"
            role="img"
            tabIndex={0}
            position="relative"
            w={{ base: "min(92vw, 520px)", md: "680px", lg: "800px" }}
            maxW="100%"
            aspectRatio="1622 / 864"
            filter={isActive ? "brightness(1)" : "brightness(0.5)"}
            transition="filter 0.5s ease-in, transform 0.5s ease-in"
          >
            <Box
              as="img"
              src="/layer1.png"
              alt=""
              draggable={false}
              position="absolute"
              inset="0"
              zIndex="1"
              w="100%"
              h="100%"
              objectFit="contain"
              pointerEvents="none"
            />

            {activeFrame ? (
              <Box
                as="img"
                src={activeFrame}
                alt=""
                draggable={false}
                position="absolute"
                zIndex="2"
                left="50%"
                top="-36%"
                w="34%"
                transform="translateX(-50%)"
                objectFit="contain"
                opacity={isFading ? 0 : 1}
                transition="opacity 0.2s ease"
                pointerEvents="none"
              />
            ) : null}

            <Box
              as="img"
              src="/layer3.png"
              alt=""
              draggable={false}
              position="absolute"
              inset="0"
              zIndex="3"
              w="100%"
              h="100%"
              objectFit="contain"
              pointerEvents="none"
            />
          </Box>
        </Stack>
      </SimpleGrid>
    </Container>
  );
}
