import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import Image from "next/image";
import { FaArrowRight } from "react-icons/fa";
import CustomTitle from "./CutsomTitle";

type HeroSectionProps = {
  muted: string;
  headingColor: string;
};

export function HeroSection({ muted, headingColor }: HeroSectionProps) {
  return (
    <Container maxW="7xl" pt={{ base: "8", md: "14" }} pb="10">
      <SimpleGrid
        columns={{ base: 1, lg: 2 }}
        spacing={{ base: "8", lg: "12" }}
        alignItems="center"
      >
        <Stack spacing="6" maxW="2xl" zIndex="1">
          <Badge
            alignSelf="flex-start"
            px="3"
            py="1"
            borderRadius="full"
            colorScheme="orange"
            variant="subtle"
            textTransform="none"
            fontSize="sm"
          >
            Protein Shake Vending
          </Badge>

          <CustomTitle
            as="h1"
            title="Automated protein shakes for your facility"
            subtitle=" iShaker vending machines serve fresh protein shakes, BCAA, creatine
            and more — on demand, 24/7. Cloud-managed with remote support, so
            you focus on your business while we keep the shakes flowing."
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

          <Flex gap="3" wrap="wrap">
            <Button
              as="a"
              href="/step1"
              variant="primary"
              rightIcon={<FaArrowRight />}
            >
              Get Started
            </Button>
            <Button as="a" href="https://ishaker.xyz" variant="contrast">
              Already registered
            </Button>
          </Flex>
        </Stack>

        <Box
          position="relative"
          minH={{ base: "340px", md: "520px" }}
          borderRadius="2xl"
          overflow="hidden"
          boxShadow="0 26px 80px rgba(0,0,0,0.45)"
        >
          <Image
            src="/intro.png"
            alt="iShaker intro image"
            fill
            priority
            sizes="(max-width: 992px) 100vw, 50vw"
            style={{ objectFit: "cover" }}
          />
          <Box
            position="absolute"
            inset="0"
            bgGradient="linear(to-t, blackAlpha.600, transparent 55%)"
          />
        </Box>
      </SimpleGrid>
    </Container>
  );
}
