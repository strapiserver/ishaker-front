import { Box, useColorModeValue } from "@chakra-ui/react";
import { NextSeo } from "next-seo";
import { Header } from "../../components/home/Header";
import { SerialNumberSection } from "../../components/step1/SerialNumberSection";

export default function Step1Page() {
  const pageBg = useColorModeValue("bg.50", "bg.900");
  const panelBg = useColorModeValue("bg.10", "bg.800");
  const muted = useColorModeValue("bg.600", "bg.300");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.100");
  const headingColor = useColorModeValue("bg.1000", "bg.50");

  return (
    <>
      <NextSeo
        title="Step 1 | iShaker"
        description="Add your machine serial number to start setting up your iShaker machine."
      />
      <Box minH="100vh" bg={pageBg} overflow="hidden">
        <Header borderColor={borderColor} />
        <Box as="main">
          <SerialNumberSection
            panelBg={panelBg}
            borderColor={borderColor}
            muted={muted}
            headingColor={headingColor}
          />
        </Box>
      </Box>
    </>
  );
}
