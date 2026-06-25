import {
  Box,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import Image from "next/image";

type SerialNumberSectionProps = {
  panelBg: string;
  borderColor: string;
  muted: string;
  headingColor: string;
};

export function SerialNumberSection({
  panelBg,
  borderColor,
  muted,
  headingColor,
}: SerialNumberSectionProps) {
  return (
    <Container maxW="7xl" py={{ base: "10", md: "16" }}>
      <SimpleGrid
        columns={{ base: 1, lg: 2 }}
        spacing={{ base: "8", lg: "12" }}
        alignItems="center"
      >
        <Stack spacing="5" maxW="xl">
          <Text
            fontSize="sm"
            letterSpacing="0.08em"
            textTransform="uppercase"
            color="peach.300"
            fontWeight="700"
          >
            Step 1
          </Text>
          <Heading
            as="h1"
            fontSize={{ base: "3xl", md: "4xl" }}
            lineHeight="1.1"
            color={headingColor}
            m="0"
          >
            Add your machine serial number
          </Heading>
          <Text
            fontSize={{ base: "md", md: "lg" }}
            lineHeight="1.8"
            color={muted}
          >
            The number can be found on the back of the machine door
          </Text>

          <Box
            bg={panelBg}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="2xl"
            p={{ base: "5", md: "6" }}
          >
            <FormControl>
              <FormLabel color={headingColor} fontWeight="600">
                Serial number
              </FormLabel>
              <Input
                placeholder="Enter numbers only"
                size="lg"
                bg="whiteAlpha.50"
                borderColor={borderColor}
                _hover={{ borderColor: "peach.300" }}
                _focusVisible={{
                  borderColor: "peach.300",
                  boxShadow: "0 0 0 1px var(--chakra-colors-peach-300)",
                }}
              />
            </FormControl>
          </Box>
        </Stack>

        <Box
          position="relative"
          minH={{ base: "320px", md: "520px" }}
          borderRadius="2xl"
          overflow="hidden"
          border="1px solid"
          borderColor={borderColor}
          boxShadow="0 26px 80px rgba(0,0,0,0.35)"
        >
          <Image
            src="/backdoor.png"
            alt="Back of the machine door with serial number location"
            fill
            priority
            sizes="(max-width: 992px) 100vw, 50vw"
            style={{ objectFit: "cover" }}
          />
        </Box>
      </SimpleGrid>
    </Container>
  );
}
