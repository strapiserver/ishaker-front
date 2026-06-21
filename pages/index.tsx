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
  useColorModeValue,
} from "@chakra-ui/react";
import { NextSeo } from "next-seo";
import Image from "next/image";
import { FaArrowRight, FaGlassCheers, FaRegClock, FaWhatsapp } from "react-icons/fa";
import heroImage from "../public/hero-machine.svg";

const stats = [
  { label: "Signature mixes", value: "40+" },
  { label: "Event formats", value: "6" },
  { label: "Service window", value: "24/7" },
];

const features = [
  {
    icon: FaGlassCheers,
    title: "Cocktail service",
    text: "A composed bar program for private events, brand launches, and venue nights.",
  },
  {
    icon: FaRegClock,
    title: "Fast planning",
    text: "Clear menus, timing, staffing, and ingredients prepared before the first guest arrives.",
  },
  {
    icon: FaWhatsapp,
    title: "Direct booking",
    text: "One clean request flow for availability, event details, and next-step confirmation.",
  },
];

export default function Home() {
  const pageBg = useColorModeValue("bg.50", "bg.900");
  const panelBg = useColorModeValue("bg.10", "bg.800");
  const muted = useColorModeValue("bg.600", "bg.300");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.100");

  return (
    <>
      <NextSeo
        title="Premium Mobile Bar"
        description="iShaker brings polished cocktail service and event bar planning to private and brand events."
      />
      <Box minH="100vh" bg={pageBg} overflow="hidden">
        <Box as="header" borderBottom="1px solid" borderColor={borderColor}>
          <Container maxW="7xl" py="4">
            <Flex align="center" justify="space-between" gap="4">
              <Box position="relative" w={{ base: "120px", md: "164px" }} h={{ base: "40px", md: "52px" }}>
                <Image
                  src="/logo-mark.svg"
                  alt="iShaker logo mark"
                  fill
                  priority
                  sizes="164px"
                  style={{ objectFit: "contain" }}
                />
              </Box>
              <Button
                as="a"
                href="mailto:hello@ishaker.xyz"
                variant="primary"
                rightIcon={<FaArrowRight />}
                size={{ base: "sm", md: "md" }}
              >
                Book
              </Button>
            </Flex>
          </Container>
        </Box>

        <Box as="main">
          <Container maxW="7xl" pt={{ base: "8", md: "14" }} pb="10">
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: "8", lg: "12" }} alignItems="center">
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
                  Mobile cocktail bar
                </Badge>
                <Heading
                  as="h1"
                  fontSize={{ base: "4xl", md: "5xl", lg: "6xl" }}
                  lineHeight="1"
                  letterSpacing="0"
                  m="0"
                  color={useColorModeValue("bg.1000", "bg.50")}
                >
                  Crafted drinks without the event friction.
                </Heading>
                <Text fontSize={{ base: "lg", md: "xl" }} lineHeight="1.8" color={muted}>
                  iShaker sets up a polished bar experience for private parties,
                  corporate nights, and launch events with menus, tools, and service
                  handled end to end.
                </Text>
                <Flex gap="3" wrap="wrap">
                  <Button as="a" href="mailto:hello@ishaker.xyz" variant="primary" rightIcon={<FaArrowRight />}>
                    Request date
                  </Button>
                  <Button as="a" href="https://ishaker.xyz" variant="contrast">
                    Visit admin
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
                  src={heroImage}
                  alt="iShaker machine with neon green lighting and mascot character"
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

          <Box borderTop="1px solid" borderBottom="1px solid" borderColor={borderColor} bg={panelBg}>
            <Container maxW="7xl" py={{ base: "8", md: "10" }}>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing="4">
                {stats.map((item) => (
                  <Box key={item.label} px="1">
                    <Text fontSize="4xl" fontWeight="700" color="peach.300">
                      {item.value}
                    </Text>
                    <Text color={muted}>{item.label}</Text>
                  </Box>
                ))}
              </SimpleGrid>
            </Container>
          </Box>

          <Container maxW="7xl" py={{ base: "10", md: "14" }}>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing="5">
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
                    bg="peach.300"
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
        </Box>
      </Box>
    </>
  );
}
