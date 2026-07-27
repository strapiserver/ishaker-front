import {
  Box,
  Button,
  Container,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import type { GetServerSideProps } from "next";
import { NextSeo } from "next-seo";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import { Header } from "../components/home/Header";
import CustomTitle from "../components/home/CutsomTitle";
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
  const pageBg = useColorModeValue("bg.50", "bg.900");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.100");
  const panelBg = useColorModeValue("bg.10", "bg.800");
  const muted = useColorModeValue("bg.600", "bg.300");
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
      <Box minH="100vh" bg={pageBg}>
        <Header borderColor={borderColor} />
        <Container maxW="3xl" py={{ base: "10", md: "16" }}>
          <VStack spacing="6" align="stretch">
            <CustomTitle
              as="h1"
              title="Choose your nickname"
              subtitle="Your nickname identifies your portal account and all machines registered to it."
              fontSize={{ base: "3xl", md: "4xl" }}
              textAlign="left"
              mt="0"
              mb="0"
              subtitleProps={{ mx: "0", color: muted }}
            />

            <Box
              as="form"
              onSubmit={submit}
              bg={panelBg}
              border="1px solid"
              borderColor={borderColor}
              borderRadius="2xl"
              p={{ base: "5", md: "7" }}
            >
              <FormControl isRequired isInvalid={Boolean(error)}>
                <FormLabel>Nickname</FormLabel>
                <Input
                  value={nickname}
                  onChange={(event) => {
                    setNickname(event.target.value);
                    setError("");
                  }}
                  placeholder="my_company"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                />
                <FormHelperText color={error ? "red.300" : muted}>
                  {error || NICKNAME_HELP}
                </FormHelperText>
              </FormControl>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                w="full"
                mt="6"
                isLoading={isChecking}
                isDisabled={!nickname.trim()}
              >
                Continue
              </Button>
              <Text color={muted} fontSize="sm" mt="4">
                Already registered? Enter the same nickname and we will take you
                to sign in.
              </Text>
            </Box>
          </VStack>
        </Container>
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
