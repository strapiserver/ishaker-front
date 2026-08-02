import {
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Icon,
  Image,
  VStack,
  Text,
} from "@chakra-ui/react";
import { NextSeo } from "next-seo";
import Link from "next/link";
import { useRouter } from "next/router";
import { PropsWithChildren, ReactNode } from "react";
import { FaExclamationCircle, FaWhatsapp } from "react-icons/fa";
import {
  FiBookOpen,
  FiBox,
  FiLogOut,
  FiPackage,
  FiTag,
  FiUsers,
} from "react-icons/fi";

type PortalShellProps = PropsWithChildren<{
  title: string;
  description?: string;
  clientName?: string;
  access?: "client" | "product";
  headerAction?: ReactNode;
  showSupportBanner?: boolean;
}>;

const navItems = [
  { href: "/machines", label: "Machines", icon: FiBox },
  { href: "/product-lines", label: "Product lines", icon: FiPackage },
  { href: "/sales", label: "Sales", icon: FiUsers },
  { href: "/promos", label: "Promos", icon: FiTag },
  { href: "/catalog", label: "Catalog", icon: FiBookOpen },
];

const whatsappBotUrl = "https://wa.me/18573927028";

export function PortalShell({
  title,
  description,
  clientName,
  access = "client",
  headerAction,
  showSupportBanner = true,
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
      <Box minH="100vh" bg="#050708" color="bg.100">
        <Box
          minH="100vh"
          w="full"
          bgGradient="linear(to-br, #101315 0%, #0b0e0f 52%, #121719 100%)"
          overflow="hidden"
        >
        <Box borderBottom="1px solid" borderColor="rgba(255,255,255,0.09)">
          <Container maxW="none" w="full" px={{ base: "4", md: "8", xl: "12" }}>
            <Flex minH={{ base: "auto", md: "73px" }} align="center" justify="space-between" gap="5" py={{ base: "4", md: "0" }}>
              <HStack as={Link} href="/product-lines" spacing={{ base: "2", sm: "4" }} minW="0" flexShrink={1} title={clientName || "iShaker Client Portal"}>
                <Image src="/s.png" alt="iShaker" boxSize={{ base: "36px", md: "46px" }} objectFit="contain" />
                <Text color="white" fontWeight="700" fontSize={{ base: "xs", sm: "sm", md: "md" }} letterSpacing="0.01em" textTransform="uppercase" noOfLines={1}>
                  iShaker Client Portal
                </Text>
              </HStack>

              <HStack spacing="0" align="stretch" display={{ base: "none", md: "flex" }} h="73px">
              {visibleNavItems.map((item) => {
                const active =
                  router.pathname === item.href ||
                  router.pathname.startsWith(`${item.href}/`);
                return (
                  <Flex
                    key={item.href}
                    as={Link}
                    href={item.href}
                    position="relative"
                    minW="82px"
                    px="3"
                    direction="column"
                    align="center"
                    justify="center"
                    gap="1"
                    color={active ? "white" : "whiteAlpha.600"}
                    _hover={{ color: "white" }}
                    _after={active ? { content: '""', position: "absolute", bottom: "0", left: "18px", right: "18px", h: "2px", bg: "#66e65c", borderRadius: "full", boxShadow: "0 0 8px rgba(102,230,92,.65)" } : undefined}
                  >
                    <Icon as={item.icon} boxSize="17px" />
                    <Text fontSize="10px" whiteSpace="nowrap">{item.label}</Text>
                  </Flex>
                );
              })}
                <Flex ml="3" pl="5" borderLeft="1px solid" borderColor="whiteAlpha.100" align="center">
                  <Button onClick={handleLogout} variant="ghost" size="sm" color="whiteAlpha.700" px="2" aria-label="Log out" title="Log out" _hover={{ color: "white", bg: "whiteAlpha.100" }}>
                    <Icon as={FiLogOut} boxSize="18px" />
                  </Button>
                </Flex>
              </HStack>

              <Button display={{ base: "flex", md: "none" }} onClick={handleLogout} variant="ghost" size="sm" color="whiteAlpha.700" px="2" aria-label="Log out">
                <Icon as={FiLogOut} boxSize="18px" />
              </Button>
            </Flex>

            <HStack display={{ base: "flex", md: "none" }} spacing="1" overflowX="auto" pb="3">
              {visibleNavItems.map((item) => {
                const active = router.pathname === item.href || router.pathname.startsWith(`${item.href}/`);
                return <Button key={item.href} as={Link} href={item.href} variant="ghost" size="sm" flexShrink={0} color={active ? "#76f85f" : "whiteAlpha.600"} leftIcon={<Icon as={item.icon} />}>{item.label}</Button>;
              })}
            </HStack>
          </Container>
        </Box>

        <Container
          maxW="none"
          w="full"
          px={{ base: "4", md: "8", xl: "12" }}
          py={{ base: "7", md: "7" }}
          display="flex"
          flexDirection="column"
        >
          {showSupportBanner ? <Box
            as="a"
            href={whatsappBotUrl}
            target="_blank"
            rel="noreferrer"
            display="block"
            position="relative"
            overflow="hidden"
            borderRadius={{ base: "xl", md: "3xl" }}
            border="1px solid"
            borderColor="whiteAlpha.100"
            bg="whiteAlpha.50"
            mt="8"
            order="3"
            _hover={{
              transform: "translateY(-2px)",
              borderColor: "whiteAlpha.300",
              boxShadow: "0 24px 48px rgba(0,0,0,0.28)",
            }}
            transition="transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease"
          >
            <Flex
              direction={{ base: "column", lg: "row" }}
              minH={{ base: "auto", lg: "250px" }}
            >
              <Box
                flex={{ lg: "0 0 60%" }}
                minH={{ base: "180px", sm: "220px", md: "280px", lg: "250px" }}
              >
                <Image
                  src="/whatsapp_bot_banner.jpg"
                  alt="WhatsApp AI support bot for iShaker machines"
                  w="100%"
                  h="100%"
                  objectFit="cover"
                />
              </Box>

              <Flex
                flex={{ base: "1", lg: "0 0 40%" }}
                minW="0"
                direction="column"
                justify="center"
                gap="5"
                px={{ base: "5", md: "8" }}
                py={{ base: "6", md: "8" }}
                bgGradient="linear(to-br, rgba(10,17,24,0.92), rgba(9,64,43,0.88))"
              >
                <VStack spacing="3" maxW="2xl" align="stretch">
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
                    Connect your machine to our WhatsApp bot for guided setup,
                    live monitoring, and direct AI support.
                  </Text>
                  <Text
                    color="whiteAlpha.800"
                    fontSize={{ base: "md", md: "lg" }}
                    maxW="xl"
                  >
                    The bot can help check machine health, adjust settings,
                    assist with diagnostics, and answer most day-to-day
                    operational questions in one chat.
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
                    color="yellow.200"
                    maxW="xl"
                  >
                    <Icon as={FaExclamationCircle} boxSize="4" mt="0.5" />
                    <Text fontSize="xs" lineHeight="1.5">
                      Use the same number you specified during registration.
                    </Text>
                  </HStack>
                </VStack>

                <Button
                  as="span"
                  alignSelf={{ base: "stretch", sm: "flex-end" }}
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
          </Box> : null}

          <Flex mb={{ base: "6", md: "7" }} align={{ base: "stretch", sm: "center" }} justify="space-between" direction={{ base: "column", sm: "row" }} gap="5" order="1">
            <VStack spacing="1" align="stretch">
              <Text color="white" fontSize={{ base: "2xl", md: "3xl" }} lineHeight="1.2" fontWeight="750">{title}</Text>
              {description ? <Text color="whiteAlpha.600" fontSize={{ base: "sm", md: "sm" }}>{description}</Text> : null}
            </VStack>
            {headerAction ? <Box flexShrink={0}>{headerAction}</Box> : null}
          </Flex>
          <Box order="2">{children}</Box>
        </Container>
        </Box>
      </Box>
    </>
  );
}
