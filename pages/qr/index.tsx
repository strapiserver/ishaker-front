import {
  Box,
  Button,
  Container,
  Heading,
  Stack,
  useColorModeValue,
} from "@chakra-ui/react";
import { NextSeo } from "next-seo";
import Image from "next/image";
import { FaArrowRight } from "react-icons/fa";
import { Header } from "../../components/home/Header";

export default function QrPage() {
  const pageBg = useColorModeValue("bg.50", "bg.900");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.100");
  const headingColor = useColorModeValue("bg.1000", "bg.50");
  const qrBg = useColorModeValue("white", "whiteAlpha.900");

  return (
    <>
      <NextSeo
        title="Scan QR"
        description="Scan the QR code to continue setting up your iShaker machine."
      />
      <Box minH="100vh" bg={pageBg} overflow="hidden">
        <Header borderColor={borderColor} />
        <Container
          as="main"
          maxW="7xl"
          minH="calc(100vh - 85px)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          py={{ base: "12", md: "16" }}
        >
          <Stack
            spacing={{ base: "7", md: "8" }}
            align="center"
            textAlign="center"
            w="full"
          >
            <Heading
              as="h1"
              fontSize={{ base: "3xl", md: "5xl" }}
              lineHeight="1.1"
              color={headingColor}
              maxW="720px"
            >
              Scan this QR to continue
            </Heading>

            <Box
              position="relative"
              w={{ base: "min(78vw, 300px)", md: "360px" }}
              aspectRatio="1"
              bg={qrBg}
              borderRadius="lg"
              p={{ base: "4", md: "5" }}
              boxShadow="0 24px 70px rgba(0,0,0,0.28)"
            >
              <Image
                src="/qr.png"
                alt="QR code to continue setup"
                fill
                priority
                sizes="(max-width: 768px) 78vw, 360px"
                style={{ objectFit: "contain", padding: "20px" }}
              />
            </Box>

            <Button
              as="a"
              href="/setup"
              variant="primary"
              size={{ base: "md", md: "lg" }}
              rightIcon={<FaArrowRight />}
            >
              Continue here
            </Button>
          </Stack>
        </Container>
      </Box>
    </>
  );
}
