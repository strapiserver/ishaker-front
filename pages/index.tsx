import type { GetStaticProps } from "next";
import { Box, useColorModeValue } from "@chakra-ui/react";
import { NextSeo } from "next-seo";
import { Cups } from "../components/home/Cups";
import type { TasteSlide } from "../components/home/Courosel";
import { FeaturesSection } from "../components/home/FeaturesSection";
import { Header } from "../components/home/Header";
import { HeroSection } from "../components/home/HeroSection";
import { StatsSection } from "../components/home/StatsSection";

const STRAPI_URL = "https://ishaker.xyz";
const TASTE_SOURCE_URL = `${STRAPI_URL}/api/tastes?pagination[pageSize]=50&populate[0]=main&populate[1]=splash&populate[2]=circle`;

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

type HomeProps = {
  tastes: TasteSlide[];
};

function normalizeMediaUrl(url?: string | null) {
  if (!url) {
    return null;
  }

  return url.startsWith("http") ? url : `${STRAPI_URL}${url}`;
}

function getSplashFrameUrl(frame: StrapiMedia) {
  return normalizeMediaUrl(
    frame.attributes?.formats?.medium?.url ??
      frame.attributes?.formats?.small?.url ??
      frame.attributes?.formats?.thumbnail?.url ??
      frame.attributes?.url,
  );
}

function getSplashSet(taste: Taste) {
  return (
    taste.attributes?.splash?.data
      ?.map((frame) => getSplashFrameUrl(frame))
      .filter((url): url is string => Boolean(url)) ?? []
  );
}

function getMainImage(taste: Taste) {
  const media = taste.attributes?.main?.data;

  return normalizeMediaUrl(
    media?.attributes?.formats?.medium?.url ??
      media?.attributes?.formats?.small?.url ??
      media?.attributes?.formats?.thumbnail?.url ??
      media?.attributes?.url,
  );
}

function getCircleImage(taste: Taste) {
  const media = taste.attributes?.circle?.data;

  return normalizeMediaUrl(
    media?.attributes?.formats?.medium?.url ??
      media?.attributes?.formats?.small?.url ??
      media?.attributes?.formats?.thumbnail?.url ??
      media?.attributes?.url,
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
        const circleImage = getCircleImage(taste);
        const mainImage = getMainImage(taste);
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

export default function Home({ tastes = [] }: HomeProps) {
  const pageBg = useColorModeValue("bg.50", "bg.900");
  const panelBg = useColorModeValue("bg.10", "bg.800");
  const muted = useColorModeValue("bg.600", "bg.300");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.100");
  const headingColor = useColorModeValue("bg.1000", "bg.50");

  return (
    <>
      <NextSeo
        title="iShaker — Protein Shake Vending Machines"
        description="Automated protein shake vending for gyms, hotels and offices. 30+ flavors, cloud-managed, 24/7 remote support."
      />
      <Box minH="100vh" bg={pageBg} overflow="hidden">
        <Header borderColor={borderColor} />

        <Box as="main">
          <HeroSection muted={muted} headingColor={headingColor} />
          <Cups tastes={tastes} />
          <StatsSection panelBg={panelBg} borderColor={borderColor} muted={muted} />
          <FeaturesSection panelBg={panelBg} borderColor={borderColor} muted={muted} />
        </Box>
      </Box>
    </>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  try {
    const response = await fetch(TASTE_SOURCE_URL);

    if (!response.ok) {
      throw new Error(`Taste request failed with ${response.status}`);
    }

    const tastes = (await response.json()) as TastesResponse;
    const tasteSlides = getTasteSlides(tastes);

    return {
      props: {
        tastes: tasteSlides,
      },
      revalidate: 300,
    };
  } catch (error) {
    console.error("[home] Failed to load splash frames:", error);

    return {
      props: {
        tastes: [],
      },
      revalidate: 60,
    };
  }
};
