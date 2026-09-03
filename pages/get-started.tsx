import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
  VStack,
} from "@chakra-ui/react";
import type { GetServerSideProps } from "next";
import { NextSeo } from "next-seo";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import { FiArrowRight, FiCheck, FiHash, FiShield, FiZap } from "react-icons/fi";
import { Header } from "../components/home/Header";
import {
  clearRegistrationDraft,
  mergeRegistrationDraft,
} from "../lib/portal/registration";
import {
  isValidNickname,
  NICKNAME_HELP,
  normalizeNickname,
} from "../lib/portal/nickname";
import { resolvePortalSession } from "../lib/portal/auth";

export default function GetStartedPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedNickname = normalizeNickname(nickname);

    if (!isValidNickname(normalizedNickname)) {
      setError(NICKNAME_HELP);
      return;
    }

    setError("");
    setIsChecking(true);
    const response = await fetch(
      `/api/portal/nickname-availability?nickname=${encodeURIComponent(
        normalizedNickname,
      )}`,
    );
    const payload = await response.json().catch(() => null);
    setIsChecking(false);

    if (!response.ok) {
      setError(payload?.message || "Nickname availability could not be checked.");
      return;
    }

    if (!payload.available) {
      await router.push({
        pathname: "/login",
        query: {
          identifier: normalizedNickname.toLowerCase(),
          reason: "nickname-exists",
        },
      });
      return;
    }

    clearRegistrationDraft();
    mergeRegistrationDraft({
      nickname: normalizedNickname,
      company: normalizedNickname,
      existingAccount: false,
    });
    await router.push("/step1");
  };

  return (
    <>
      <NextSeo title="Get started | iShaker" noindex nofollow />
      <Box minH="100vh" bg="#0d1010" color="white" overflow="hidden">
        <Header borderColor="whiteAlpha.100" />
        <Box position="relative">
          <Box position="absolute" top="-180px" left="-120px" boxSize="560px" borderRadius="full" bg="violet.500" opacity="0.1" filter="blur(120px)" pointerEvents="none" />
          <Container maxW="6xl" py={{ base: "10", md: "16", lg: "20" }} position="relative">
            <Flex direction={{ base: "column", lg: "row" }} gap={{ base: "10", lg: "16" }} align="center">
              <Box flex="1">
                <Text color="acid.300" fontSize="sm" fontWeight="800" letterSpacing=".12em" textTransform="uppercase" mb="5">Create your iShaker account</Text>
                <Heading as="h1" color="white" fontSize={{ base: "4xl", md: "6xl" }} lineHeight="1" letterSpacing="-.045em" m="0" mb="6">Let’s get your machine online.</Heading>
                <Text color="whiteAlpha.700" fontSize={{ base: "lg", md: "xl" }} lineHeight="1.7" maxW="570px">Start with a memorable nickname. We’ll then guide you through the machine, location, and account details one simple step at a time.</Text>
                <VStack align="stretch" spacing="4" mt="9">
                  {[
                    { icon: FiZap, text: "A guided setup that takes only a few minutes" },
                    { icon: FiShield, text: "Secure portal access for your team" },
                    { icon: FiCheck, text: "Sales and maintenance tools included" },
                  ].map((item) => (
                    <Flex key={item.text} gap="3" align="center" color="whiteAlpha.800"><Flex boxSize="9" align="center" justify="center" borderRadius="lg" bg="rgba(118,248,95,.1)" color="acid.300"><Icon as={item.icon} /></Flex><Text fontWeight="650">{item.text}</Text></Flex>
                  ))}
                </VStack>
              </Box>

              <Box as="form" onSubmit={submit} flex="0 1 470px" w="full" bg="rgba(255,255,255,.055)" border="1px solid" borderColor="whiteAlpha.100" borderRadius="3xl" p={{ base: "6", md: "9" }} boxShadow="0 30px 90px rgba(0,0,0,.34)">
                <Flex align="center" gap="3" mb="6"><Flex boxSize="11" align="center" justify="center" borderRadius="xl" bg="acid.300" color="bg.1000"><FiHash size="21px" /></Flex><Box><Text fontSize="xs" color="whiteAlpha.500" fontWeight="800" letterSpacing=".1em" textTransform="uppercase">Step 1 of 4</Text><Heading as="h2" color="white" fontSize="2xl" m="0">Choose a nickname</Heading></Box></Flex>
                <Text color="whiteAlpha.600" lineHeight="1.7" mb="6">This identifies your account and all machines registered to it.</Text>
                <FormControl isRequired isInvalid={Boolean(error)}>
                  <FormLabel color="whiteAlpha.800">Account nickname</FormLabel>
                  <InputGroup size="lg">
                    <InputLeftElement pointerEvents="none" color="whiteAlpha.400"><FiHash /></InputLeftElement>
                    <Input value={nickname} onChange={(event) => { setNickname(event.target.value); setError(""); }} placeholder="my_company" autoComplete="username" autoCapitalize="none" spellCheck={false} bg="whiteAlpha.50" borderColor="whiteAlpha.200" _placeholder={{ color: "whiteAlpha.300" }} />
                  </InputGroup>
                  <FormHelperText color={error ? "red.300" : "whiteAlpha.500"} lineHeight="1.55">{error || NICKNAME_HELP}</FormHelperText>
                </FormControl>
                <Button type="submit" variant="primary" size="lg" w="full" mt="7" isLoading={isChecking} loadingText="Checking nickname" isDisabled={!nickname.trim()} rightIcon={<FiArrowRight />}>Continue registration</Button>
                <Text color="whiteAlpha.500" fontSize="sm" textAlign="center" mt="6">Already registered? <Box as={Link} href="/login" color="acid.300" fontWeight="800">Sign in</Box></Text>
              </Box>
            </Flex>
          </Container>
        </Box>
      </Box>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const session = await resolvePortalSession(context.req.headers.cookie);
    if (session) {
      return {
        redirect: {
          destination: "/machines",
          permanent: false,
        },
      };
    }
  } catch (error) {
    console.error("[get-started] session lookup failed:", error);
  }

  return { props: {} };
};
