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
  InputRightElement,
  Select,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { NextSeo } from "next-seo";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaEye, FaEyeSlash, FaWhatsapp } from "react-icons/fa";
import { Header } from "../../components/home/Header";
import CustomTitle from "../../components/home/CutsomTitle";
import { loadRegistrationDraft, mergeRegistrationDraft } from "../../lib/portal/registration";

const WHATSAPP_COUNTRY_CODES = [
  { value: "+1", label: "US/CA +1" },
  { value: "+44", label: "UK +44" },
  { value: "+49", label: "DE +49" },
  { value: "+61", label: "AU +61" },
  { value: "+971", label: "UAE +971" },
];

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
  const [messengerCountryCode, setMessengerCountryCode] = useState("+1");
  const [messengerValue, setMessengerValue] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const draft = loadRegistrationDraft();
    if (!draft?.serialNumber) {
      router.replace("/step1");
      return;
    }

    setContactName(draft.contactName || "");
    setEmail(draft.email || "");
    setMessengerCountryCode(draft.messengerCountryCode || "+1");
    setMessengerValue(draft.messengerValue || "");
    setPassword(draft.password || "");
    setPasswordConfirmation(draft.passwordConfirmation || "");
  }, [router]);

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
    if (!/^\+\d{1,4}$/.test(messengerCountryCode) || digits.length < 6) {
      setError("Enter a valid WhatsApp number with country code.");
      return;
    }

    setError("");
    mergeRegistrationDraft({
      contactName,
      email,
      messengerType: "whatsapp",
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
          <Stack spacing="5" maxW="2xl" mb="8">
            <Text fontSize="sm" textTransform="uppercase" color="acid.300" fontWeight="700">
              Step 3
            </Text>
            <CustomTitle
              as="h1"
              title="Add the portal contact"
              subtitle="This person becomes the point of contact for the machine registration."
              fontSize={{ base: "3xl", md: "4xl" }}
              textAlign="left"
              mt="0"
              mb="0"
              subtitleProps={{ mx: "0", color: muted }}
            />
          </Stack>

          <Box bg={panelBg} border="1px solid" borderColor={borderColor} borderRadius="2xl" p="6">
            <Stack spacing="4">
              <FormControl isRequired>
                <FormLabel>Full name</FormLabel>
                <Input value={contactName} onChange={(event) => setContactName(event.target.value)} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel>WhatsApp</FormLabel>
                <HStack
                  spacing="2"
                  color="green.300"
                  fontSize="sm"
                  fontWeight="700"
                  mb="3"
                >
                  <Icon as={FaWhatsapp} />
                  <Text>We use WhatsApp as the primary support channel for this machine.</Text>
                </HStack>
                <HStack align="start" spacing="3">
                  <Select
                    maxW="160px"
                    value={messengerCountryCode}
                    onChange={(event) => setMessengerCountryCode(event.target.value)}
                  >
                    {WHATSAPP_COUNTRY_CODES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                  <Input
                    value={messengerValue}
                    onChange={(event) =>
                      setMessengerValue(formatWhatsappLocalNumber(event.target.value))
                    }
                    placeholder="555 123 4567"
                    inputMode="tel"
                  />
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
                    onChange={(event) => setPasswordConfirmation(event.target.value)}
                    autoComplete="new-password"
                  />
                  <InputRightElement>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPasswordConfirmation((value) => !value)}
                      aria-label="Toggle password confirmation visibility"
                    >
                      {showPasswordConfirmation ? <FaEyeSlash /> : <FaEye />}
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>
            </Stack>
          </Box>

          {error ? (
            <Text color="red.300" mt="4">
              {error}
            </Text>
          ) : null}

          <Text color={muted} mt="4">
            Google sign-in is also available for this same email once the provider is configured.
            {" "}
            <Text as={Link} href="/login" color="acid.300">
              Review login options
            </Text>
          </Text>

          <Button
            mt="6"
            variant="primary"
            onClick={handleNext}
            isDisabled={!contactName || !email || !messengerValue || !password || !passwordConfirmation}
          >
            Review request
          </Button>
        </Container>
      </Box>
    </>
  );
}
