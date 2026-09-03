import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Icon,
  Image,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { NextSeo } from "next-seo";
import Link from "next/link";
import {
  FiArrowRight,
  FiCheck,
  FiMonitor,
  FiShoppingBag,
  FiZap,
} from "react-icons/fi";
import { Header } from "../components/home/Header";

const machines = [
  {
    name: "iShaker S",
    tagline: "Compact power for everyday locations",
    description:
      "A space-efficient automated shake station for gyms, studios, offices, and hotels.",
    image: "/shaker-s-right.png",
    href: "/shaker-s",
    badge: "Compact",
  },
  {
    name: "iShaker Touch",
    tagline: "A premium touchscreen experience",
    description:
      "A guided, high-impact vending experience made for busy and premium venues.",
    image: "/shaker-touch-right.png",
    href: "/shaker-touch",
    badge: "Touchscreen",
  },
];

const benefits = [
  {
    icon: FiZap,
    title: "Always ready",
    text: "Fresh self-service shakes, available around the clock.",
  },
  {
    icon: FiMonitor,
    title: "Cloud managed",
    text: "Remote sales, health, inventory, and machine controls.",
  },
  {
    icon: FiCheck,
    title: "Supported",
    text: "Guided setup and practical support for daily operations.",
  },
];

export default function ShopPage() {
  return (
    <>
      <NextSeo
        title="iShaker Shop"
        description="Explore iShaker automated protein shake vending machines for gyms, hotels, offices, and retail spaces."
      />
      <Box minH="100vh" bg="#101212" color="white" overflow="hidden">
        <Header borderColor="whiteAlpha.100" />
        <Box position="relative">
          <Box
            position="absolute"
            top="-180px"
            left="12%"
            boxSize="520px"
            borderRadius="full"
            bg="acid.400"
            opacity="0.08"
            filter="blur(110px)"
            pointerEvents="none"
          />
          <Container
            maxW="7xl"
            pt={{ base: "14", md: "20" }}
            pb={{ base: "16", md: "24" }}
            position="relative"
          >
            <VStack
              spacing="5"
              maxW="820px"
              mx="auto"
              textAlign="center"
              mb={{ base: "10", md: "14" }}
            >
              <Badge
                display="flex"
                alignItems="center"
                gap="2"
                bg="rgba(118,248,95,.1)"
                color="acid.300"
                border="1px solid"
                borderColor="rgba(118,248,95,.2)"
                borderRadius="full"
                px="4"
                py="2"
              >
                <FiShoppingBag /> iShaker Shop
              </Badge>
              <Heading
                as="h1"
                color="white"
                fontSize={{ base: "4xl", md: "6xl" }}
                lineHeight="1"
                letterSpacing="-.045em"
                m="0"
              >
                Pick the machine that fits your space.
              </Heading>
              <Text
                color="whiteAlpha.700"
                fontSize={{ base: "lg", md: "xl" }}
                lineHeight="1.7"
                maxW="680px"
              >
                Two formats, one complete platform for serving fresh shakes and
                running your business remotely.
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="7">
              {machines.map((machine) => (
                <Flex
                  key={machine.name}
                  direction={{ base: "column", sm: "row" }}
                  minH={{ sm: "410px" }}
                  bgGradient="linear(to-br, rgba(255,255,255,.075), rgba(255,255,255,.025))"
                  border="1px solid"
                  borderColor="whiteAlpha.100"
                  borderRadius="3xl"
                  overflow="hidden"
                  boxShadow="0 28px 80px rgba(0,0,0,.24)"
                  transition="all 180ms ease"
                  _hover={{
                    transform: "translateY(-5px)",
                    borderColor: "rgba(118,248,95,.34)",
                  }}
                >
                  <Flex
                    flex="1"
                    minH={{ base: "310px", sm: "auto" }}
                    align="center"
                    justify="center"
                    p="5"
                    bgGradient="radial(circle at 50% 65%, rgba(118,248,95,.15), transparent 58%)"
                  >
                    <Image
                      src={machine.image}
                      alt={machine.name}
                      maxH="350px"
                      maxW="100%"
                      objectFit="contain"
                    />
                  </Flex>
                  <Flex
                    flex="1"
                    direction="column"
                    justify="center"
                    align="flex-start"
                    p={{ base: "6", md: "8" }}
                  >
                    <Badge
                      bg="acid.300"
                      color="bg.1000"
                      borderRadius="full"
                      px="3"
                      py="1"
                      mb="4"
                    >
                      {machine.badge}
                    </Badge>
                    <Heading as="h2" color="white" fontSize="3xl" m="0" mb="2">
                      {machine.name}
                    </Heading>
                    <Text color="acid.300" fontWeight="800" mb="4">
                      {machine.tagline}
                    </Text>
                    <Text color="whiteAlpha.700" lineHeight="1.7" mb="7">
                      {machine.description}
                    </Text>
                    <Button
                      as={Link}
                      href={machine.href}
                      variant="primary"
                      rightIcon={<FiArrowRight />}
                    >
                      Explore machine
                    </Button>
                  </Flex>
                </Flex>
              ))}
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing="5" mt="7">
              {benefits.map((benefit) => (
                <Flex
                  key={benefit.title}
                  p="6"
                  gap="4"
                  bg="whiteAlpha.50"
                  border="1px solid"
                  borderColor="whiteAlpha.100"
                  borderRadius="2xl"
                >
                  <Flex
                    flexShrink={0}
                    boxSize="11"
                    align="center"
                    justify="center"
                    borderRadius="xl"
                    bg="rgba(118,248,95,.1)"
                    color="acid.300"
                  >
                    <Icon as={benefit.icon} boxSize="5" />
                  </Flex>
                  <Box>
                    <Text fontWeight="800" mb="1">
                      {benefit.title}
                    </Text>
                    <Text color="whiteAlpha.600" fontSize="sm" lineHeight="1.6">
                      {benefit.text}
                    </Text>
                  </Box>
                </Flex>
              ))}
            </SimpleGrid>

            <Flex
              mt={{ base: "10", md: "14" }}
              p={{ base: "7", md: "10" }}
              direction={{ base: "column", md: "row" }}
              align={{ md: "center" }}
              justify="space-between"
              gap="6"
              borderRadius="3xl"
              bgGradient="linear(to-r, rgba(118,248,95,.16), rgba(122,109,225,.13))"
              border="1px solid"
              borderColor="whiteAlpha.100"
            >
              <Box>
                <Heading
                  as="h2"
                  color="white"
                  fontSize={{ base: "2xl", md: "3xl" }}
                  m="0"
                  mb="2"
                >
                  Ready to bring iShaker to your location?
                </Heading>
                <Text color="whiteAlpha.700">
                  Create your portal account and start the guided setup.
                </Text>
              </Box>
              <Button
                as={Link}
                href="/get-started"
                variant="primary"
                size="lg"
                flexShrink={0}
                rightIcon={<FiArrowRight />}
              >
                Get started
              </Button>
            </Flex>
          </Container>
        </Box>
      </Box>
    </>
  );
}
