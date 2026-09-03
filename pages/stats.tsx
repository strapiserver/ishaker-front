import { Box, useColorModeValue } from "@chakra-ui/react";
import { NextSeo } from "next-seo";
import { Header } from "../components/home/Header";
import { Stats } from "../components/home/Stats";

export default function PublicStatsPage() {
  const pageBg = useColorModeValue("bg.50", "bg.900");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.100");

  return (
    <>
      <NextSeo
        title="Realtime Sales"
        description="Recent iShaker transactions and hourly public fleet statistics."
      />
      <Box minH="100vh" bg={pageBg}>
        <Header borderColor={borderColor} />
        <Box as="main">
          <Stats showMachines />
        </Box>
      </Box>
    </>
  );
}
