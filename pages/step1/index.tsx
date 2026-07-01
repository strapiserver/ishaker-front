import { Box, useColorModeValue } from "@chakra-ui/react";
import { NextSeo } from "next-seo";
import { Header } from "../../components/home/Header";
import { SetupBegin } from "../../components/setup/SetupBegin";

export default function Step1Page() {
  const pageBg = useColorModeValue("bg.50", "bg.900");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.100");

  return (
    <>
      <NextSeo
        title="Step 1 | iShaker"
        description="Add your machine serial number to start setting up your iShaker machine."
      />
      <Box minH="100vh" bg={pageBg} overflow="hidden">
        <Header borderColor={borderColor} />
        <Box as="main">
          <SetupBegin />
        </Box>
      </Box>
    </>
  );
}
