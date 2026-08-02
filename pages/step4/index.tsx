import {
  Box,
  Button,
  Container,
  Link,
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
  const [errorSupportUrl, setErrorSupportUrl] = useState("");

  useEffect(() => {
    const nextDraft = loadRegistrationDraft();
    const hasAccountDetails =
      nextDraft?.existingAccount ||
      Boolean(nextDraft?.contactName && nextDraft?.email && nextDraft?.password);
    if (
      !nextDraft?.serialNumber ||
      !nextDraft.nickname ||
      !nextDraft.country ||
      !nextDraft.state ||
      !nextDraft.city ||
      !nextDraft.currencyId ||
      !hasAccountDetails
    ) {
      router.replace("/step1");
      return;
    }

    setDraft(nextDraft);
  }, [router]);

  const submit = async () => {
    if (!draft) return;
    setError("");
    setErrorSupportUrl("");
    setIsSubmitting(true);

    const response = await fetch("/api/portal/register-machine", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(draft),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      if (payload?.redirectTo) {
        await router.push(payload.redirectTo);
        return;
      }
      setError(getErrorMessage(payload));
      if (
        payload?.error === "serial_number_issue" &&
        typeof payload?.supportUrl === "string"
      ) {
        setErrorSupportUrl(payload.supportUrl);
      }
      return;
    }

    router.push(
      `/step5?accountCreated=${draft.existingAccount ? "0" : "1"}`,
    );
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
              subtitle={draft?.existingAccount
                ? "This machine will be attached to your existing portal account."
                : "This creates your portal account and attaches the machine to it."}
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
                <Text>
                  {[draft?.city, draft?.state, draft?.country]
                    .filter(Boolean)
                    .join(", ")}
                </Text>
                <Text>Currency: {draft?.currencyCode || "Selected currency"}</Text>
                {draft?.location ? <Text>Site: {draft.location}</Text> : null}
              </VStack>
            </Box>

            <Box bg={panelBg} border="1px solid" borderColor={borderColor} borderRadius="2xl" p="6">
              <Text color="acid.300" fontWeight="700" mb="3">
                {draft?.existingAccount ? "Owner account" : "Portal contact"}
              </Text>
              <VStack spacing="2" color={muted} align="stretch">
                <Text>Nickname: {draft?.nickname}</Text>
                {draft?.contactName ? <Text>{draft.contactName}</Text> : null}
                {draft?.email ? <Text>{draft.email}</Text> : null}
                {draft?.messengerValue ? (
                  <Text>
                    {`WhatsApp: ${draft.messengerCountryCode || ""} ${draft.messengerValue}`.trim()}
                  </Text>
                ) : null}
                {!draft?.existingAccount ? (
                  <Text>Auth: {draft?.authProvider || "local"}</Text>
                ) : null}
                {draft?.notes ? <Text>Notes: {draft.notes}</Text> : null}
              </VStack>
            </Box>
          </SimpleGrid>

          {error ? (
            <Text color="red.300" mt="5">
              {error}{" "}
              {errorSupportUrl ? (
                <Link
                  href={errorSupportUrl}
                  isExternal
                  fontWeight="700"
                  textDecoration="underline"
                >
                  Contact support on WhatsApp
                </Link>
              ) : null}
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
