import { Box, Button, Container, Spinner, Text, VStack } from "@chakra-ui/react";
import { NextSeo } from "next-seo";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!router.isReady) return;

    const token = typeof router.query.access_token === "string" ? router.query.access_token : "";
    const providerError = typeof router.query.error === "string" ? router.query.error : "";

    if (providerError) {
      setError(providerError);
      return;
    }

    if (!token) {
      setError("Google login did not return an access token.");
      return;
    }

    const run = async () => {
      const response = await fetch("/api/portal/oauth-login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jwt: token }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.message || "Google login could not be completed.");
        return;
      }

      router.replace("/product-lines");
    };

    run();
  }, [router]);

  return (
    <>
      <NextSeo title="Google Sign-In" noindex nofollow />
      <Box minH="100vh" bg="bg.1000" color="bg.100">
        <Container maxW="xl" py="20">
          <VStack spacing="5" align="flex-start">
            <Text color="acid.300" fontWeight="800">
              Google sign-in
            </Text>
            {error ? (
              <>
                <Text color="red.300">{error}</Text>
                <Button as={Link} href="/login" variant="primary">
                  Back to login
                </Button>
              </>
            ) : (
              <>
                <Spinner color="acid.300" size="lg" />
                <Text color="bg.300">Completing your sign-in.</Text>
              </>
            )}
          </VStack>
        </Container>
      </Box>
    </>
  );
}
