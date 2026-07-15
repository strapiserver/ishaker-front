import {
  Badge,
  Button,
  Container,
  Flex,
  SimpleGrid,
  VStack,
} from "@chakra-ui/react";
import { FaArrowRight } from "react-icons/fa";
import CustomTitle from "./CutsomTitle";
import { SmokeScene } from "./smoke";

type HeroSectionProps = {
  muted: string;
  headingColor: string;
};

export function HeroSection({ muted, headingColor }: HeroSectionProps) {
  return (
    <Container maxW="7xl" pt={{ base: "8", md: "14" }} pb="10" mb="100">
      <SimpleGrid
        columns={{ base: 1, lg: 2 }}
        spacing={{ base: "6", lg: "12" }}
        alignItems="center"
      >
        <VStack
          spacing="6"
          maxW="2xl"
          zIndex="1"
          order={{ base: 2, lg: 1 }}
          align={{ base: "center", lg: "flex-start" }}
          textAlign={{ base: "center", lg: "left" }}
        >
          <Badge
            alignSelf={{ base: "center", lg: "flex-start" }}
            px="3"
            py="1"
            mt={{ base: "20", lg: "0" }}
            mb="-4"
            borderRadius="full"
            colorScheme="green"
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

          <Flex
            gap="3"
            wrap="wrap"
            justify={{ base: "center", lg: "flex-start" }}
          >
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
        </VStack>

        <SmokeScene
          ml={{ base: "10", lg: "0" }}
          mb="5"
          mt={{ base: "180", lg: "200" }}
          justifySelf={{ base: "center", lg: "end" }}
          placeSelf={{ base: "center", lg: "center end" }}
        />
      </SimpleGrid>
    </Container>
  );
}
