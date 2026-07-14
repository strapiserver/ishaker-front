import {
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Icon,
  Image,
  Stack,
  Text,
} from "@chakra-ui/react";
import { NextSeo } from "next-seo";
import Link from "next/link";
import { useRouter } from "next/router";
import { PropsWithChildren } from "react";
import { FaExclamationCircle, FaWhatsapp } from "react-icons/fa";

type PortalShellProps = PropsWithChildren<{
  title: string;
  description?: string;
  clientName?: string;
  access?: "client" | "product";
}>;

const navItems = [
  { href: "/machines", label: "Machines" },
  { href: "/product-lines", label: "Product lines" },
  { href: "/sales", label: "Sales" },
  { href: "/promos", label: "Promos" },
  { href: "/catalog", label: "Catalog" },
];

const whatsappBotUrl = process.env.NEXT_PUBLIC_WHATSAPP_BOT_URL || "#";

export function PortalShell({
  title,
  description,
  clientName,
  access = "client",
  children,
}: PortalShellProps) {
  const router = useRouter();
  const visibleNavItems =
    access === "product"
      ? navItems.filter((item) => item.href === "/product-lines")
      : navItems;

  const handleLogout = async () => {
    await fetch("/api/portal/logout", { method: "POST" });
    router.replace("/login");
  };

  return (
    <>
      <NextSeo title={title} noindex nofollow />
      <Box minH="100vh" bg="bg.1000" color="bg.100">
        <Box borderBottom="1px solid" borderColor="whiteAlpha.100">
          <Container maxW="7xl" py="4">
            <Flex align="center" justify="space-between" gap="4" wrap="wrap">
              <Stack spacing="0">
                <Text
                  as={Link}
                  href={access === "product" ? "/product-lines" : "/machines"}
                  color="acid.300"
                  fontWeight="800"
                  letterSpacing="0.06em"
                  textTransform="uppercase"
                >
                  iShaker Client Portal
                </Text>
                {clientName ? (
                  <Text color="bg.300" fontSize="sm">
                    {clientName}
                  </Text>
                ) : null}
              </Stack>

              <HStack spacing="2" flexWrap="wrap">
                {visibleNavItems.map((item) => {
                  const active =
                    router.pathname === item.href ||
                    router.pathname.startsWith(`${item.href}/`);
                  return (
                    <Button
                      key={item.href}
                      as={Link}
                      href={item.href}
                      variant={active ? "primary" : "contrast"}
                      size="sm"
                    >
                      {item.label}
                    </Button>
                  );
                })}
                <Button onClick={handleLogout} variant="shaded" size="sm">
                  Log out
                </Button>
              </HStack>
            </Flex>
          </Container>
        </Box>

        <Container maxW="7xl" py={{ base: "8", md: "10" }}>
          <Box
            as="a"
            href={whatsappBotUrl}
            target="_blank"
            rel="noreferrer"
            display="block"
            position="relative"
            overflow="hidden"
            borderRadius="3xl"
            border="1px solid"
            borderColor="whiteAlpha.100"
            bg="whiteAlpha.50"
            mb="8"
            _hover={{
              transform: "translateY(-2px)",
              borderColor: "whiteAlpha.300",
              boxShadow: "0 24px 48px rgba(0,0,0,0.28)",
            }}
            transition="transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease"
          >
            <Flex direction={{ base: "column", lg: "row" }} minH={{ base: "auto", lg: "250px" }}>
              <Box flex={{ lg: "0 0 43%" }} minH={{ base: "220px", md: "280px", lg: "250px" }}>
                <Image
                  src="/whatsapp_bot_banner.jpg"
                  alt="WhatsApp AI support bot for iShaker machines"
                  w="100%"
                  h="100%"
                  objectFit="cover"
                />
              </Box>

              <Flex
                flex="1"
                direction="column"
                justify="center"
                gap="5"
                px={{ base: "5", md: "8" }}
                py={{ base: "6", md: "8" }}
                bgGradient="linear(to-br, rgba(10,17,24,0.92), rgba(9,64,43,0.88))"
              >
                <Stack spacing="3" maxW="2xl">
                  <Text
                    fontSize="sm"
                    fontWeight="800"
                    letterSpacing="0.08em"
                    textTransform="uppercase"
                    color="green.200"
                  >
                    WhatsApp AI Support
                  </Text>
                  <Text
                    color="white"
                    fontSize={{ base: "2xl", md: "3xl" }}
                    lineHeight="1.1"
                    fontWeight="900"
                  >
                    Connect your machine to our WhatsApp bot for guided setup, live monitoring, and direct AI support.
                  </Text>
                  <Text color="whiteAlpha.800" fontSize={{ base: "md", md: "lg" }} maxW="xl">
                    The bot can help check machine health, adjust settings, assist with diagnostics, and answer most day-to-day operational questions in one chat.
                  </Text>
                  <HStack
                    spacing="3"
                    align="start"
                    bg="rgba(254, 226, 226, 0.12)"
                    border="1px solid"
                    borderColor="rgba(252, 165, 165, 0.28)"
                    borderRadius="xl"
                    px="4"
                    py="3"
                    color="red.100"
                    maxW="xl"
                  >
                    <Icon as={FaExclamationCircle} boxSize="4" color="red.200" mt="0.5" />
                    <Text fontSize="sm" lineHeight="1.5">
                      Connect with THE SAME number you specified during registration.
                    </Text>
                  </HStack>
                </Stack>

                <Button
                  as="span"
                  alignSelf="flex-start"
                  leftIcon={<Icon as={FaWhatsapp} boxSize="5" />}
                  size="lg"
                  px="7"
                  color="white"
                  bgGradient="linear(to-r, green.400, green.500, green.600)"
                  boxShadow="0 14px 30px rgba(34, 197, 94, 0.28)"
                  _hover={{
                    bgGradient: "linear(to-r, green.300, green.500, green.700)",
                  }}
                  _active={{
                    bgGradient: "linear(to-r, green.500, green.600, green.700)",
                  }}
                >
                  Connect bot
                </Button>
              </Flex>
            </Flex>
          </Box>

          <Stack spacing="2" mb="8">
            <Text color="bg.50" fontSize={{ base: "3xl", md: "4xl" }} fontWeight="800">
              {title}
            </Text>
            {description ? <Text color="bg.300">{description}</Text> : null}
          </Stack>
          {children}
        </Container>
      </Box>
    </>
  );
}
