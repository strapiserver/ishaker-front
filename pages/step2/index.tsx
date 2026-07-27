import {
  Box,
  Button,
  Container,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Select,
  VStack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { NextSeo } from "next-seo";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Header } from "../../components/home/Header";
import CustomTitle from "../../components/home/CutsomTitle";
import { loadRegistrationDraft, mergeRegistrationDraft } from "../../lib/portal/registration";
import { NICKNAME_HELP } from "../../lib/portal/nickname";
import type { GetServerSideProps } from "next";
import { requestStrapiRestAsService } from "../../services/server/strapiClient";
import type { Currency } from "../../types/strapi";

type Step2PageProps = { currencies: Currency[] };

export default function Step2Page({ currencies }: Step2PageProps) {
  const router = useRouter();
  const pageBg = useColorModeValue("bg.50", "bg.900");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.100");
  const panelBg = useColorModeValue("bg.10", "bg.800");
  const muted = useColorModeValue("bg.600", "bg.300");
  const [nickname, setNickname] = useState("");
  const [country, setCountry] = useState("USA");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [machineLabel, setMachineLabel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [currencyId, setCurrencyId] = useState("");

  useEffect(() => {
    const draft = loadRegistrationDraft();
    if (!draft?.serialNumber) {
      router.replace("/step1");
      return;
    }

    setNickname(draft.nickname || draft.company || "");
    setCountry(draft.country || "USA");
    setState(draft.state || "");
    setCity(draft.city || "");
    setLocation(draft.location || "");
    setNotes(draft.notes || "");
    setMachineLabel(draft.machineTitle || "Selected machine");
    setSerialNumber(draft.serialNumber);
    const defaultCurrency =
      currencies.find((currency) => currency.code?.toUpperCase() === "USD") ||
      currencies[0];
    setCurrencyId(
      draft.currencyId ? String(draft.currencyId) : defaultCurrency ? String(defaultCurrency.id) : "",
    );
  }, [currencies, router]);

  const handleNext = () => {
    const draft = mergeRegistrationDraft({
      nickname,
      company: nickname,
      country,
      state,
      city,
      location,
      notes,
      currencyId,
      currencyCode: currencies.find((currency) => String(currency.id) === currencyId)?.code,
      currencySymbol: currencies.find((currency) => String(currency.id) === currencyId)?.symbol || undefined,
    });
    router.push(draft.existingAccount ? "/step4" : "/step3");
  };

  return (
    <>
      <NextSeo title="Step 2 | Registration" />
      <Box minH="100vh" bg={pageBg}>
        <Header borderColor={borderColor} />
        <Container maxW="5xl" py={{ base: "8", md: "12" }}>
          <VStack spacing="5" maxW="2xl" mb="8" align="stretch">
            <Text fontSize="sm" textTransform="uppercase" color="acid.300" fontWeight="700">
              Step 2
            </Text>
            <CustomTitle
              as="h1"
              title="Confirm the machine and location"
              subtitle="The nickname identifies the owner. Location data is used to name and manage the machine."
              fontSize={{ base: "3xl", md: "4xl" }}
              textAlign="left"
              mt="0"
              mb="0"
              subtitleProps={{ mx: "0", color: muted }}
            />
          </VStack>

          <VStack spacing="6" align="stretch">
            <Box bg={panelBg} border="1px solid" borderColor={borderColor} borderRadius="2xl" p="6">
              <Text color="bg.50" fontWeight="700">{machineLabel}</Text>
              <Text color={muted} mt="1">Serial number: {serialNumber}</Text>
            </Box>

            <Box bg={panelBg} border="1px solid" borderColor={borderColor} borderRadius="2xl" p="6">
              <VStack spacing="4" align="stretch">
                <FormControl isRequired>
                  <FormLabel>Nickname</FormLabel>
                  <Input value={nickname} isReadOnly />
                  <FormHelperText>{NICKNAME_HELP}</FormHelperText>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Country</FormLabel>
                  <Input
                    value={country}
                    onChange={(event) => setCountry(event.target.value)}
                    placeholder="USA"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>State / region</FormLabel>
                  <Input
                    value={state}
                    onChange={(event) => setState(event.target.value)}
                    placeholder="NY"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>City</FormLabel>
                  <Input
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    placeholder="New York"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Currency</FormLabel>
                  <Select
                    value={currencyId}
                    onChange={(event) => setCurrencyId(event.target.value)}
                    placeholder="Select currency"
                  >
                    {currencies.map((currency) => (
                      <option key={currency.id} value={currency.id}>
                        {currency.code}
                        {currency.name ? ` — ${currency.name}` : ""}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Machine location</FormLabel>
                  <Input
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="Gym, hotel, office, campus, or branch"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Notes for ops</FormLabel>
                  <Input
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Anything useful before the portal account is approved"
                  />
                </FormControl>
              </VStack>
            </Box>

            <Button
              alignSelf="flex-start"
              variant="primary"
              onClick={handleNext}
              isDisabled={!nickname || !country || !state || !city || !currencyId}
            >
              Continue
            </Button>
          </VStack>
        </Container>
      </Box>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Step2PageProps> = async () => {
  const params = new URLSearchParams();
  params.set("filters[isActive][$ne]", "false");
  params.set("sort[0]", "code:ASC");
  params.set("pagination[pageSize]", "2000");
  const currencies = await requestStrapiRestAsService<Currency[]>(
    `/api/currencies?${params.toString()}`,
  ).catch(() => []);
  return { props: { currencies } };
};
