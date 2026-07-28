import { Box, useColorModeValue } from "@chakra-ui/react";
import { NextSeo } from "next-seo";
import { Header } from "../home/Header";
import { ProductCharacteristics } from "./ProductCharacteristics";
import { ProductHero } from "./ProductHero";
import { ProductOutputProfile } from "./ProductOutputProfile";
import type { ProductPageProps } from "./types";

export function ProductPage({
  characteristics,
  description,
  imageAlt,
  imageSrc,
  plotData,
  seoDescription,
  title,
}: ProductPageProps) {
  const pageBg = useColorModeValue("bg.50", "bg.900");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.100");

  return (
    <>
      <NextSeo title={title} description={seoDescription} />
      <Box minH="100vh" bg={pageBg} overflow="hidden">
        <Header borderColor={borderColor} />
        <Box as="main">
          <ProductHero
            description={description}
            imageAlt={imageAlt}
            imageSrc={imageSrc}
            title={title}
          />
          <ProductCharacteristics characteristics={characteristics} />
          <ProductOutputProfile plotData={plotData} />
        </Box>
      </Box>
    </>
  );
}

export type { ProductPageProps } from "./types";
