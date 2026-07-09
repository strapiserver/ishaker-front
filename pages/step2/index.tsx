import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { NextSeo } from "next-seo";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Header } from "../../components/home/Header";
import CustomTitle from "../../components/home/CutsomTitle";
import { loadRegistrationDraft, mergeRegistrationDraft } from "../../lib/portal/registration";

export default function Step2Page() {
  const router = useRouter();
  const pageBg = useColorModeValue("bg.50", "bg.900");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.100");
  const panelBg = useColorModeValue("bg.10", "bg.800");
  const muted = useColorModeValue("bg.600", "bg.300");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [machineLabel, setMachineLabel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");

  useEffect(() => {
    const draft = loadRegistrationDraft();
    if (!draft?.serialNumber) {
      router.replace("/step1");
      return;
    }

    setCompany(draft.company || "");
    setLocation(draft.location || "");
    setNotes(draft.notes || "");
    setMachineLabel(draft.machineTitle || "Selected machine");
    setSerialNumber(draft.serialNumber);
  }, [router]);

  const handleNext = () => {
    mergeRegistrationDraft({ company, location, notes });
    router.push("/step3");
  };

  return (
    <>
      <NextSeo title="Step 2 | Registration" />
      <Box minH="100vh" bg={pageBg}>
        <Header borderColor={borderColor} />
        <Container maxW="5xl" py={{ base: "8", md: "12" }}>
          <Stack spacing="5" maxW="2xl" mb="8">
            <Text fontSize="sm" textTransform="uppercase" color="acid.300" fontWeight="700">
              Step 2
            </Text>
            <CustomTitle
              as="h1"
              title="Confirm the machine and company"
              subtitle="We use this to route the request to the right client account."
              fontSize={{ base: "3xl", md: "4xl" }}
              textAlign="left"
              mt="0"
              mb="0"
              subtitleProps={{ mx: "0", color: muted }}
            />
          </Stack>

          <Stack spacing="6">
            <Box bg={panelBg} border="1px solid" borderColor={borderColor} borderRadius="2xl" p="6">
              <Text color="bg.50" fontWeight="700">{machineLabel}</Text>
              <Text color={muted} mt="1">Serial number: {serialNumber}</Text>
            </Box>

            <Box bg={panelBg} border="1px solid" borderColor={borderColor} borderRadius="2xl" p="6">
              <Stack spacing="4">
                <FormControl>
                  <FormLabel>Your name or company name</FormLabel>
                  <Input value={company} onChange={(event) => setCompany(event.target.value)} />
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
              </Stack>
            </Box>

            <Button alignSelf="flex-start" variant="primary" onClick={handleNext} isDisabled={!company}>
              Continue
            </Button>
          </Stack>
        </Container>
      </Box>
    </>
  );
}
