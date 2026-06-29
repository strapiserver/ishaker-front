import { Box, useColorModeValue } from "@chakra-ui/react";
import { NextSeo } from "next-seo";
import { Brands } from "../components/home/Brands";
import { Cups } from "../components/home/Cups";
import { FeaturesSection } from "../components/home/FeaturesSection";
import { Header } from "../components/home/Header";
import { HeroSection } from "../components/home/HeroSection";
import { ShakerScene } from "../components/home/shaker-scene";
import { StatsSection } from "../components/home/StatsSection";

export default function Home() {
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

          <StatsSection
            panelBg={panelBg}
            borderColor={borderColor}
            muted={muted}
          />

          <Cups />
          <StatsSection
            panelBg={panelBg}
            borderColor={borderColor}
            muted={muted}
          />

          <ShakerScene />
          <Brands />
          <FeaturesSection
            panelBg={panelBg}
            borderColor={borderColor}
            muted={muted}
          />
        </Box>
      </Box>
    </>
  );
}
