import { Box, Container, SimpleGrid, VStack } from "@chakra-ui/react";
import Image from "next/image";
import CustomTitle from "../home/CutsomTitle";

type ProductHeroProps = {
  description: string;
  imageAlt: string;
  imageSrc: string;
  title: string;
};

export function ProductHero({
  description,
  imageAlt,
  imageSrc,
  title,
}: ProductHeroProps) {
  return (
    <Container
      maxW="7xl"
      pt={{ base: "8", md: "14" }}
      pb={{ base: "10", md: "16" }}
    >
      <SimpleGrid
        columns={{ base: 1, lg: 2 }}
        spacing={{ base: "8", lg: "12" }}
        alignItems="center"
      >
        <VStack
          spacing="6"
          maxW="2xl"
          order={{ base: 2, lg: 1 }}
          align={{ base: "center", lg: "flex-start" }}
          textAlign={{ base: "center", lg: "left" }}
        >
          <CustomTitle
            as="h1"
            title={title}
            subtitle={description}
            mt="0"
            mb="0"
            textAlign={{ base: "center", lg: "left" }}
            fontSize={{ base: "3xl", md: "5xl" }}
            subtitleProps={{
              fontSize: { base: "md", md: "lg" },
              lineHeight: "1.8",
              mx: "0",
            }}
          />
        </VStack>

        <Box
          position="relative"
          order={{ base: 1, lg: 2 }}
          justifySelf={{ base: "center", lg: "end" }}
          w={{ base: "min(92vw, 520px)", lg: "100%" }}
          maxW="620px"
          aspectRatio="1"
        >
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            priority
            sizes="(max-width: 991px) 92vw, 620px"
            style={{ objectFit: "contain" }}
          />
        </Box>
      </SimpleGrid>
    </Container>
  );
}
