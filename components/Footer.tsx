import {
  Box,
  Container,
  HStack,
  Link as ChakraLink,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import Image from "next/image";
import Link from "next/link";

const productLinks = [
  { href: "/shaker-s", label: "iShaker S" },
  { href: "/shaker-touch", label: "iShaker Touch" },
  { href: "/step1", label: "Get started" },
];

const resourceLinks = [
  { href: "/articles", label: "Articles" },
  { href: "/login", label: "Client portal" },
];

const FooterLink = ({ href, label }: { href: string; label: string }) => (
  <ChakraLink
    as={Link}
    href={href}
    color="whiteAlpha.700"
    fontSize="sm"
    transition="color 160ms ease"
    _hover={{ color: "white", textDecoration: "none" }}
  >
    {label}
  </ChakraLink>
);

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      as="footer"
      bg="#080b0f"
      color="white"
      borderTop="1px solid"
      borderColor="whiteAlpha.100"
    >
      <Container maxW="7xl" py={{ base: "10", md: "14" }}>
        <SimpleGrid
          columns={{ base: 1, sm: 2, lg: 4 }}
          spacing={{ base: "9", lg: "12" }}
        >
          <VStack align="flex-start" spacing="4" maxW="300px">
            <Box as={Link} href="/" aria-label="iShaker home">
              <Image
                src="/logo.png"
                alt="iShaker"
                width={203}
                height={40}
                style={{
                  width: "164px",
                  height: "auto",
                  filter: "grayscale(1) contrast(1.2)",
                  opacity: 0.88,
                }}
              />
            </Box>
            <Text color="whiteAlpha.600" fontSize="sm" lineHeight="1.7">
              Automated protein shake machines for gyms, hotels, offices, and
              modern retail spaces.
            </Text>
          </VStack>

          <VStack align="flex-start" spacing="3">
            <Text fontSize="sm" fontWeight="800" letterSpacing="0.08em">
              MACHINES
            </Text>
            {productLinks.map((item) => (
              <FooterLink key={item.href} {...item} />
            ))}
          </VStack>

          <VStack align="flex-start" spacing="3">
            <Text fontSize="sm" fontWeight="800" letterSpacing="0.08em">
              RESOURCES
            </Text>
            {resourceLinks.map((item) => (
              <FooterLink key={item.href} {...item} />
            ))}
          </VStack>

          <VStack align="flex-start" spacing="3">
            <Text fontSize="sm" fontWeight="800" letterSpacing="0.08em">
              SUPPORT
            </Text>
            <Text color="whiteAlpha.600" fontSize="sm" lineHeight="1.7">
              Setup guidance, machine monitoring, and everyday operational
              support.
            </Text>
          </VStack>
        </SimpleGrid>

        <HStack
          mt={{ base: "10", md: "14" }}
          pt="6"
          borderTop="1px solid"
          borderColor="whiteAlpha.100"
          justify="space-between"
          align="center"
          flexWrap="wrap"
          gap="3"
        >
          <Text color="whiteAlpha.500" fontSize="xs">
            © {currentYear} iShaker. All rights reserved.
          </Text>
          <Text color="whiteAlpha.500" fontSize="xs">
            Smart vending. Fresh shakes. Available 24/7.
          </Text>
        </HStack>
      </Container>
    </Box>
  );
}
