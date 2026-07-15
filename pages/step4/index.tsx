import {
  Box,
  Button,
  Container,
  SimpleGrid,
  VStack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { NextSeo } from "next-seo";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Header } from "../../components/home/Header";
import CustomTitle from "../../components/home/CutsomTitle";
import { loadRegistrationDraft } from "../../lib/portal/registration";
import type { RegistrationDraft } from "../../types/portal";

const getErrorMessage = (payload: any) => {
  if (typeof payload?.message === "string" && payload.message) return payload.message;
  if (typeof payload?.details === "string" && payload.details) return payload.details;

  if (payload?.details && typeof payload.details === "object") {
    try {
      return JSON.stringify(payload.details);
    } catch {
      return "Registration request could not be sent.";
    }
  }

  return "Registration request could not be sent.";
};

export default function Step4Page() {
  const router = useRouter();
  const pageBg = useColorModeValue("bg.50", "bg.900");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.100");
  const panelBg = useColorModeValue("bg.10", "bg.800");
  const muted = useColorModeValue("bg.600", "bg.300");
  const [draft, setDraft] = useState<RegistrationDraft | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const nextDraft = loadRegistrationDraft();
    if (!nextDraft?.serialNumber || !nextDraft.company || !nextDraft.contactName || !nextDraft.email) {
      router.replace("/step1");
      return;
    }

    setDraft(nextDraft);
  }, [router]);

  const submit = async () => {
    if (!draft) return;
    setError("");
    setIsSubmitting(true);

    const response = await fetch("/api/portal/register-machine", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(draft),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(getErrorMessage(payload));
      return;
    }

    router.push("/step5");
  };

  return (
    <>
      <NextSeo title="Step 4 | Registration" />
      <Box minH="100vh" bg={pageBg}>
        <Header borderColor={borderColor} />
        <Container maxW="6xl" py={{ base: "8", md: "12" }}>
          <VStack spacing="5" maxW="2xl" mb="8" align="stretch">
            <Text fontSize="sm" textTransform="uppercase" color="acid.300" fontWeight="700">
              Step 4
            </Text>
            <CustomTitle
              as="h1"
              title="Review and submit"
              subtitle="This creates a registration request in Strapi for ops to review."
              fontSize={{ base: "3xl", md: "4xl" }}
              textAlign="left"
              mt="0"
              mb="0"
              subtitleProps={{ mx: "0", color: muted }}
            />
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing="6">
            <Box bg={panelBg} border="1px solid" borderColor={borderColor} borderRadius="2xl" p="6">
              <Text color="acid.300" fontWeight="700" mb="3">Machine</Text>
              <VStack spacing="2" color={muted} align="stretch">
                <Text>{draft?.machineTitle || "Selected machine"}</Text>
                <Text>Serial: {draft?.serialNumber}</Text>
                {draft?.machineTypeName ? <Text>Type: {draft.machineTypeName}</Text> : null}
                {draft?.location ? <Text>Location: {draft.location}</Text> : null}
              </VStack>
            </Box>

            <Box bg={panelBg} border="1px solid" borderColor={borderColor} borderRadius="2xl" p="6">
              <Text color="acid.300" fontWeight="700" mb="3">Portal contact</Text>
              <VStack spacing="2" color={muted} align="stretch">
                <Text>{draft?.company}</Text>
                <Text>{draft?.contactName}</Text>
                <Text>{draft?.email}</Text>
                {draft?.messengerValue ? (
                  <Text>
                    {`WhatsApp: ${draft.messengerCountryCode || ""} ${draft.messengerValue}`.trim()}
                  </Text>
                ) : null}
                <Text>Auth: {draft?.authProvider || "local"}</Text>
                {draft?.notes ? <Text>Notes: {draft.notes}</Text> : null}
              </VStack>
            </Box>
          </SimpleGrid>

          {error ? (
            <Text color="red.300" mt="5">
              {error}
            </Text>
          ) : null}

          <Button mt="6" variant="primary" onClick={submit} isLoading={isSubmitting}>
            Submit registration
          </Button>
        </Container>
      </Box>
    </>
  );
}
