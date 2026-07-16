import { Box, Button, Container, Flex } from "@chakra-ui/react";
import Image from "next/image";
import Link from "next/link";

type HeaderProps = {
  borderColor: string;
};

export function Header({ borderColor }: HeaderProps) {
  return (
    <Box as="header" borderBottom="1px solid" borderColor={borderColor}>
      <Container maxW="7xl" py="4">
        <Flex align="center" justify="space-between" gap="4">
          <Box as={Link} href="/" display="block" aria-label="iShaker home">
            <Box
              position="relative"
              w={{ base: "120px", md: "164px" }}
              h={{ base: "40px", md: "52px" }}
            >
              <Image
                src="/logo.png"
                alt="iShaker logo"
                fill
                priority
                sizes="164px"
                style={{ objectFit: "contain" }}
              />
            </Box>
          </Box>
          <Button
            as={Link}
            href="/login"
            variant="primary"
            size={{ base: "sm", md: "md" }}
          >
            Login
          </Button>
        </Flex>
      </Container>
    </Box>
  );
}
