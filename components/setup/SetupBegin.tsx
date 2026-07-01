import {
  Box,
  Container,
  SimpleGrid,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import Image from "next/image";
import CustomTitle from "../home/CutsomTitle";

export function SetupBegin() {
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.100");
  const muted = useColorModeValue("bg.600", "bg.300");

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
            color="acid.300"
            fontWeight="700"
          >
            Setup your machine
          </Text>
          <CustomTitle
            as="h1"
            title="Add your machine serial number"
            subtitle="The number can be found on the back of the machine door"
            fontSize={{ base: "3xl", md: "4xl" }}
            textAlign="left"
            mt="0"
            mb="0"
            subtitleProps={{
              mx: "0",
              fontSize: { base: "md", md: "lg" },
              lineHeight: "1.8",
              color: muted,
              fontWeight: "normal",
            }}
          />
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
            src="/intro.png"
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
