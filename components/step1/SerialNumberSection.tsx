import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import Image from "next/image";
import { useRouter } from "next/router";
import { ChangeEvent, useEffect, useState } from "react";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  clearMachineLookup,
  fetchMachineBySerial,
} from "../../redux/strapiSlice";
import { mergeRegistrationDraft } from "../../lib/portal/registration";
import CustomTitle from "../home/CutsomTitle";

const SERIAL_DEBOUNCE_MS = 3000;

export function SerialNumberSection() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { selectedMachine, selectedClient, serialLookupStatus } = useAppSelector(
    (state) => state.strapi,
  );

  const [serial, setSerial] = useState("");
  const [isDebouncing, setIsDebouncing] = useState(false);

  const panelBg = useColorModeValue("bg.10", "bg.800");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.100");
  const muted = useColorModeValue("bg.600", "bg.300");
  const headingColor = useColorModeValue("bg.1000", "bg.50");
  const successColor = useColorModeValue("green.600", "green.300");
  const errorColor = useColorModeValue("red.600", "red.300");

  const trimmedSerial = serial.trim();
  const isSearching = isDebouncing || serialLookupStatus === "loading";
  const canContinue = serialLookupStatus === "found" && Boolean(selectedMachine);

  useEffect(() => {
    if (!trimmedSerial) {
      setIsDebouncing(false);
      dispatch(clearMachineLookup());
      return;
    }

    setIsDebouncing(true);
    const timeout = window.setTimeout(() => {
      setIsDebouncing(false);
      dispatch(fetchMachineBySerial(trimmedSerial));
    }, SERIAL_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [dispatch, trimmedSerial]);

  const handleSerialChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSerial(event.target.value);
    dispatch(clearMachineLookup());
  };

  const handleNext = () => {
    if (!canContinue) return;
    mergeRegistrationDraft({
      machineId: selectedMachine?.id,
      serialNumber: selectedMachine?.serial_number || trimmedSerial,
      machineTitle: selectedMachine?.title,
      machineTypeName: selectedMachine?.machine_type?.name,
      clientId: selectedClient?.id,
      company: selectedClient?.company || "",
    });
    router.push("/step2");
  };

  return (
    <Container maxW="7xl" py={{ base: "10", md: "16" }}>
      <SimpleGrid
        columns={{ base: 1, lg: 2 }}
        spacing={{ base: "8", lg: "12" }}
        alignItems="center"
      >
        <Stack spacing="5" maxW="xl">
          <Text
            fontSize="sm"
            letterSpacing="0.08em"
            textTransform="uppercase"
            color="acid.300"
            fontWeight="700"
          >
            Step 1
          </Text>
          <CustomTitle
            as="h1"
            title="Add your machine serial number"
            subtitle="The number can be found on the back of the machine door"
            fontSize={{ base: "3xl", md: "4xl" }}
            textAlign="left"
            mt="0"
            mb="0"
            subtitleProps={{
              mx: "0",
              fontSize: { base: "md", md: "lg" },
              lineHeight: "1.8",
              color: muted,
              fontWeight: "normal",
            }}
          />

          <Box
            bg={panelBg}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="2xl"
            p={{ base: "5", md: "6" }}
          >
            <FormControl>
              <FormLabel color={headingColor} fontWeight="600">
                Serial number
              </FormLabel>
              <InputGroup size="lg">
                <Input
                  value={serial}
                  onChange={handleSerialChange}
                  placeholder="Enter numbers only"
                  bg="whiteAlpha.50"
                  borderColor={borderColor}
                  pr="12"
                  _hover={{ borderColor: "acid.300" }}
                  _focusVisible={{
                    borderColor: "acid.300",
                    boxShadow: "0 0 0 1px var(--chakra-colors-acid-300)",
                  }}
                />
                {isSearching ? (
                  <InputRightElement>
                    <Spinner color="acid.300" size="sm" />
                  </InputRightElement>
                ) : canContinue ? (
                  <InputRightElement color={successColor}>
                    <FaCheckCircle aria-label="Machine found" />
                  </InputRightElement>
                ) : serialLookupStatus === "notFound" ||
                  serialLookupStatus === "failed" ? (
                  <InputRightElement color={errorColor}>
                    <FaTimesCircle aria-label="Machine not found" />
                  </InputRightElement>
                ) : null}
              </InputGroup>
            </FormControl>
            <Button
              mt="5"
              size="lg"
              w="full"
              variant="primary"
              isDisabled={!canContinue}
              onClick={handleNext}
            >
              Next
            </Button>
            {selectedMachine ? (
              <Stack spacing="1" mt="4">
                <Text color={headingColor} fontWeight="700">
                  {selectedMachine.title || "Machine found"}
                </Text>
                <Text color={muted} fontSize="sm">
                  Serial: {selectedMachine.serial_number}
                </Text>
                {selectedClient?.company ? (
                  <Text color={muted} fontSize="sm">
                    Current client: {selectedClient.company}
                  </Text>
                ) : null}
              </Stack>
            ) : null}
          </Box>
        </Stack>

        <Box
          position="relative"
          minH={{ base: "320px", md: "520px" }}
          borderRadius="2xl"
          overflow="hidden"
          border="1px solid"
          borderColor={borderColor}
          boxShadow="0 26px 80px rgba(0,0,0,0.35)"
        >
          <Image
            src="/backdoor.png"
            alt="Back of the machine door with serial number location"
            fill
            priority
            sizes="(max-width: 992px) 100vw, 50vw"
            style={{ objectFit: "cover" }}
          />
        </Box>
      </SimpleGrid>
    </Container>
  );
}
