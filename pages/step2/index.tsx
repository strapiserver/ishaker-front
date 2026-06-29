import {
  Box,
  Container,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { NextSeo } from "next-seo";
import Image from "next/image";
import { Header } from "../../components/home/Header";
import CustomTitle from "../../components/home/CutsomTitle";

export default function Step2Page() {
  const pageBg = useColorModeValue("bg.50", "bg.900");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.100");
  const imageBg = "bg.1000";
  const imageShadow = useColorModeValue(
    "0 24px 70px rgba(15, 23, 42, 0.22)",
    "0 28px 80px rgba(0, 0, 0, 0.42)"
  );

  return (
    <>
      <NextSeo
        title="Step 2 | iShaker"
        description="Choose flavors for your iShaker machine."
      />
      <Box minH="100vh" bg={pageBg} overflow="hidden">
        <Header borderColor={borderColor} />
        <Box as="main">
          <Container maxW="7xl" py={{ base: "8", md: "12" }}>
            <Stack spacing="5" maxW="xl" mb={{ base: "6", md: "8" }}>
              <Text
                fontSize="sm"
                letterSpacing="0.08em"
                textTransform="uppercase"
                color="peach.300"
                fontWeight="700"
              >
                Step 2
              </Text>
              <CustomTitle
                as="h1"
                title="Order powders"
                fontSize={{ base: "3xl", md: "4xl" }}
                textAlign="left"
                mt="0"
                mb="0"
              />
            </Stack>
            <Box
              bg={imageBg}
              border="1px solid"
              borderColor={borderColor}
              borderRadius="2xl"
              boxShadow={imageShadow}
              overflow="hidden"
            >
              <Image
                src="/flavors.png"
                alt="iShaker flavors"
                width={1672}
                height={941}
                priority
                sizes="(max-width: 1280px) 100vw, 1280px"
                style={{
                  display: "block",
                  width: "100%",
                  height: "auto",
                }}
              />
            </Box>
          </Container>
        </Box>
      </Box>
    </>
  );
}
