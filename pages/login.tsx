import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { NextSeo } from "next-seo";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const response = await fetch("/api/portal/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });

    setIsLoading(false);

    if (!response.ok) {
      setError("Invalid email/username or password.");
      return;
    }

    router.replace("/machines");
  };

  return (
    <>
      <NextSeo title="Client Login" noindex nofollow />
      <Flex minH="100vh" bg="bg.1000" color="bg.100" align="center" justify="center" px="5">
        <Box w="100%" maxW="460px">
          <Text color="acid.300" fontSize="sm" fontWeight="700" textTransform="uppercase" mb="3">
            iShaker Client Portal
          </Text>
          <Heading color="bg.50" fontSize={{ base: "36px", md: "44px" }} mb="3">
            Sign in
          </Heading>
          <Text color="bg.300" mb="8">
            Use the email or username and password assigned to this client account in Strapi.
          </Text>

          <Box
            as="form"
            onSubmit={onSubmit}
            bg="bg.900"
            border="1px solid"
            borderColor="whiteAlpha.100"
            borderRadius="2xl"
            p={{ base: "5", md: "6" }}
          >
            <Stack spacing="4">
              <FormControl>
                <FormLabel>Email or username</FormLabel>
                <Input
                  type="text"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  autoComplete="username"
                  bg="bg.800"
                  borderColor="whiteAlpha.200"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  bg="bg.800"
                  borderColor="whiteAlpha.200"
                />
              </FormControl>
            </Stack>

            {error ? (
              <Text color="red.300" fontSize="sm" mt="4">
                {error}
              </Text>
            ) : null}

            <Button mt="6" type="submit" variant="primary" w="full" isLoading={isLoading}>
              Continue
            </Button>

            <Button
              as={Link}
              href="/api/portal/google/start"
              mt="3"
              w="full"
              variant="contrast"
            >
              Continue with Google
            </Button>
          </Box>
        </Box>
      </Flex>
    </>
  );
}
