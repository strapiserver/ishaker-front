import { Box, Button, Container, Flex } from "@chakra-ui/react";
import Image from "next/image";
import { FaArrowRight } from "react-icons/fa";

type HeaderProps = {
  borderColor: string;
};

export function Header({ borderColor }: HeaderProps) {
  return (
    <Box as="header" borderBottom="1px solid" borderColor={borderColor}>
      <Container maxW="7xl" py="4">
        <Flex align="center" justify="space-between" gap="4">
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
          <Button
            as="a"
            href="/step1"
            variant="primary"
            rightIcon={<FaArrowRight />}
            size={{ base: "sm", md: "md" }}
          >
            Get Started
          </Button>
        </Flex>
      </Container>
    </Box>
  );
}
