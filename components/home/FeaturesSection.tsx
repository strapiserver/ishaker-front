import {
  Box,
  Container,
  Flex,
  Heading,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import { features } from "./data";

type FeaturesSectionProps = {
  panelBg: string;
  borderColor: string;
  muted: string;
};

export function FeaturesSection({
  panelBg,
  borderColor,
  muted,
}: FeaturesSectionProps) {
  return (
    <Container maxW="7xl" py={{ base: "10", md: "14" }}>
      <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing="5">
        {features.map((feature) => (
          <Box
            key={feature.title}
            bg={panelBg}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="lg"
            p="6"
            minH="220px"
          >
            <Flex
              w="12"
              h="12"
              align="center"
              justify="center"
              borderRadius="full"
              bg="acid.300"
              color="bg.900"
              mb="5"
            >
              <feature.icon size="22" />
            </Flex>
            <Heading as="h2" fontSize="xl" m="0 0 3">
              {feature.title}
            </Heading>
            <Text color={muted} lineHeight="1.7">
              {feature.text}
            </Text>
          </Box>
        ))}
      </SimpleGrid>
    </Container>
  );
}
