import { Box, Button, Flex, Heading, Text } from "@chakra-ui/react";
import { FiPower } from "react-icons/fi";

export function AdminHeader() {
  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  return (
    <Box
      borderBottom="1px solid"
      borderColor="whiteAlpha.100"
      bg="rgba(20,19,19,0.86)"
      position="sticky"
      top={0}
      zIndex={2}
    >
      <Flex
        maxW="1280px"
        mx="auto"
        px={{ base: 4, md: 8 }}
        py={4}
        align="center"
        justify="space-between"
        gap={4}
      >
        <Box>
          <Text fontSize="sm" color="acid.300" fontWeight="700">
            iShaker Admin
          </Text>
          <Heading
            as="h1"
            color="bg.50"
            fontSize={{ base: "24px", md: "34px" }}
            lineHeight="1.1"
            my={0}
          >
            Client machines
          </Heading>
        </Box>

        <Button
          leftIcon={<FiPower />}
          onClick={logout}
          variant="outline"
          borderColor="whiteAlpha.200"
          color="bg.100"
          borderRadius="8px"
          _hover={{ bg: "whiteAlpha.100" }}
        >
          Logout
        </Button>
      </Flex>
    </Box>
  );
}
