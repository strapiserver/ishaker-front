import {
  Box,
  Button,
  Container,
  VStack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { NextSeo } from "next-seo";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { Header } from "../../components/home/Header";
import CustomTitle from "../../components/home/CutsomTitle";
import { clearRegistrationDraft } from "../../lib/portal/registration";

export default function Step5Page() {
  const router = useRouter();
  const pageBg = useColorModeValue("bg.50", "bg.900");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.100");
  const panelBg = useColorModeValue("bg.10", "bg.800");
  const muted = useColorModeValue("bg.600", "bg.300");

  useEffect(() => {
    clearRegistrationDraft();
  }, []);

  return (
    <>
      <NextSeo title="Step 5 | Registration complete" />
      <Box minH="100vh" bg={pageBg}>
        <Header borderColor={borderColor} />
        <Container maxW="4xl" py={{ base: "10", md: "16" }}>
          <Box bg={panelBg} border="1px solid" borderColor={borderColor} borderRadius="3xl" p={{ base: "6", md: "8" }}>
            <VStack spacing="5" align="stretch">
              <Text fontSize="sm" textTransform="uppercase" color="acid.300" fontWeight="700">
                Step 5
              </Text>
              <CustomTitle
                as="h1"
                title={
                  router.query.accountCreated === "0"
                    ? "Machine registered"
                    : "Portal account created"
                }
                subtitle={
                  router.query.accountCreated === "0"
                    ? "The machine was added to your existing portal account."
                    : "Your machine registration was saved and your portal login is now active."
                }
                fontSize={{ base: "3xl", md: "4xl" }}
                textAlign="left"
                mt="0"
                mb="0"
                subtitleProps={{ mx: "0", color: muted }}
              />
              <Text color={muted}>
                You can continue straight to the client cabinet and manage all
                machines owned by this nickname.
              </Text>
              <Button as={Link} href="/machines" variant="primary" alignSelf="flex-start">
                Open client cabinet
              </Button>
            </VStack>
          </Box>
        </Container>
      </Box>
    </>
  );
}
