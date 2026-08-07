import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Select,
  VStack,
  Text,
  useColorModeValue,
  Badge,
} from "@chakra-ui/react";
import { NextSeo } from "next-seo";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaEye, FaEyeSlash, FaWhatsapp } from "react-icons/fa";
import {
  getCountries,
  getCountryCallingCode,
  type CountryCode,
} from "libphonenumber-js";
import { Header } from "../../components/home/Header";
import CustomTitle from "../../components/home/CutsomTitle";
import {
  loadRegistrationDraft,
  mergeRegistrationDraft,
} from "../../lib/portal/registration";

const formatWhatsappCountryCode = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits ? `+${digits}` : "";
};

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });
const countryCodes = getCountries();
const countryCodeSet = new Set<string>(countryCodes);

const countryFlag = (country: CountryCode) =>
  String.fromCodePoint(
    ...country
      .toUpperCase()
      .split("")
      .map((character) => 127397 + character.charCodeAt(0)),
  );

const countryOptions = countryCodes
  .map((country) => ({
    country,
    name: countryNames.of(country) || country,
    callingCode: `+${getCountryCallingCode(country)}`,
  }))
  .sort((left, right) => left.name.localeCompare(right.name));

const countryForCallingCode = (callingCode: string) =>
  countryOptions.find((option) => option.callingCode === callingCode)?.country;

const formatWhatsappLocalNumber = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)} ${digits.slice(10)}`;
};

export default function Step3Page() {
  const router = useRouter();
  const pageBg = useColorModeValue("bg.50", "bg.900");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.100");
  const panelBg = useColorModeValue("bg.10", "bg.800");
  const muted = useColorModeValue("bg.600", "bg.300");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [messengerCountry, setMessengerCountry] =
    useState<CountryCode>("US");
  const [messengerCountryCode, setMessengerCountryCode] = useState("+1");
  const [messengerValue, setMessengerValue] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const draft = loadRegistrationDraft();
    if (!draft?.serialNumber) {
      router.replace("/step1");
      return;
    }

    if (draft.existingAccount) {
      router.replace("/step4");
      return;
    }

    setContactName(draft.contactName || "");
    setEmail(draft.email || "");
    const savedCallingCode = draft.messengerCountryCode || "+1";
    const savedCountry = countryCodeSet.has(draft.messengerCountryIso || "")
      ? (draft.messengerCountryIso as CountryCode)
      : countryForCallingCode(savedCallingCode) || "US";
    setMessengerCountry(savedCountry);
    setMessengerCountryCode(savedCallingCode);
    setMessengerValue(draft.messengerValue || "");
    setPassword(draft.password || "");
    setPasswordConfirmation(draft.passwordConfirmation || "");
  }, [router]);

  const handleCountryChange = (country: CountryCode) => {
    setMessengerCountry(country);
    setMessengerCountryCode(`+${getCountryCallingCode(country)}`);
  };

  const handleCountryCodeChange = (value: string) => {
    const callingCode = formatWhatsappCountryCode(value);
    setMessengerCountryCode(callingCode);

    if (`+${getCountryCallingCode(messengerCountry)}` !== callingCode) {
      const matchingCountry = countryForCallingCode(callingCode);
      if (matchingCountry) setMessengerCountry(matchingCountry);
    }
  };

  const handleNext = () => {
    if (!messengerValue) {
      setError("Enter your WhatsApp number.");
      return;
    }

    if (password.length < 8) {
      setError("Use at least 8 characters for the password.");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      return;
    }

    const digits = messengerValue.replace(/\D/g, "");
    if (!/^\+[1-9]\d{0,3}$/.test(messengerCountryCode) || digits.length < 6) {
      setError("Enter a valid WhatsApp number with country code.");
      return;
    }

    setError("");
    mergeRegistrationDraft({
      contactName,
      email,
      messengerType: "whatsapp",
      messengerCountryIso: messengerCountry,
      messengerCountryCode,
      messengerValue: formatWhatsappLocalNumber(messengerValue),
      password,
      passwordConfirmation,
      authProvider: "local",
    });
    router.push("/step4");
  };

  return (
    <>
      <NextSeo title="Step 3 | Registration" />
      <Box minH="100vh" bg={pageBg}>
        <Header borderColor={borderColor} />
        <Container maxW="5xl" py={{ base: "8", md: "12" }}>
          <VStack spacing="5" maxW="2xl" mb="8" align="stretch">
            <Text
              fontSize="sm"
              textTransform="uppercase"
              color="acid.300"
              fontWeight="700"
            >
              Step 3
            </Text>
            <CustomTitle
              as="h1"
              title="Add the portal contact"
              subtitle="This creates the portal login and primary support contact for the new account."
              fontSize={{ base: "3xl", md: "4xl" }}
              textAlign="left"
              mt="0"
              mb="0"
              subtitleProps={{ mx: "0", color: muted }}
            />
          </VStack>

          <Box
            bg={panelBg}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="2xl"
            p="6"
          >
            <VStack spacing="4" align="stretch">
              <FormControl isRequired>
                <FormLabel>Full name</FormLabel>
                <Input
                  value={contactName}
                  onChange={(event) => setContactName(event.target.value)}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </FormControl>
              <FormControl>
                <HStack alignItems="flex-top">
                  <FormLabel>WhatsApp</FormLabel>
                  <Badge
                    maxH="20px"
                    variant="outline"
                    colorScheme="orange"
                    fontSize="xs"
                    mt="1"
                  >
                    IMPORTANT
                  </Badge>
                </HStack>

                <HStack align="start" spacing="3">
                  <InputGroup maxW="200px">
                    <InputLeftElement
                      w="84px"
                      pointerEvents="auto"
                      display="flex"
                    >
                      <Text fontSize="xl" aria-hidden="true">
                        {countryFlag(messengerCountry)}
                      </Text>
                      <Select
                        position="absolute"
                        inset="0"
                        w="84px"
                        h="100%"
                        rootProps={{ h: "100%" }}
                        opacity="0"
                        cursor="pointer"
                        value={messengerCountry}
                        onChange={(event) =>
                          handleCountryChange(event.target.value as CountryCode)
                        }
                        aria-label="Select WhatsApp country"
                      >
                        {countryOptions.map((option) => (
                          <option
                            key={option.country}
                            value={option.country}
                          >
                            {countryFlag(option.country)} {option.name}{" "}
                            {option.callingCode}
                          </option>
                        ))}
                      </Select>
                    </InputLeftElement>
                    <Input
                      value={messengerCountryCode}
                      onChange={(event) =>
                        handleCountryCodeChange(event.target.value)
                      }
                      placeholder="+1"
                      inputMode="numeric"
                      maxLength={5}
                      pl="84px"
                      textAlign="right"
                      aria-label="WhatsApp country calling code"
                    />
                  </InputGroup>

                  <Input
                    value={messengerValue}
                    onChange={(event) =>
                      setMessengerValue(
                        formatWhatsappLocalNumber(event.target.value),
                      )
                    }
                    placeholder="555 123 4567"
                    inputMode="tel"
                  />
                </HStack>
                <HStack
                  spacing="2"
                  color="green.300"
                  fontSize="sm"
                  fontWeight="700"
                  mt="3"
                >
                  <Icon as={FaWhatsapp} />
                  <Text fontSize="sm">
                    We use WhatsApp as the primary support channel for this
                    machine. Make sure you use a valid number that you can
                    access. You will receive a confirmation message on this
                    account.
                  </Text>
                </HStack>
              </FormControl>
              <FormControl>
                <FormLabel>Create password</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                  />
                  <InputRightElement>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              <FormControl>
                <FormLabel>Confirm password</FormLabel>
                <InputGroup>
                  <Input
                    type={showPasswordConfirmation ? "text" : "password"}
                    value={passwordConfirmation}
                    onChange={(event) =>
                      setPasswordConfirmation(event.target.value)
                    }
                    autoComplete="new-password"
                  />
                  <InputRightElement>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setShowPasswordConfirmation((value) => !value)
                      }
                      aria-label="Toggle password confirmation visibility"
                    >
                      {showPasswordConfirmation ? <FaEyeSlash /> : <FaEye />}
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>
            </VStack>
          </Box>

          {error ? (
            <Text color="red.300" mt="4">
              {error}
            </Text>
          ) : null}

          <Button
            mt="6"
            variant="primary"
            onClick={handleNext}
            isDisabled={
              !contactName ||
              !email ||
              !messengerValue ||
              !password ||
              !passwordConfirmation
            }
          >
            Review request
          </Button>
        </Container>
      </Box>
    </>
  );
}
