import {
  Alert,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Select,
  SimpleGrid,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import type { Currency, Machine } from "../../../types/strapi";

type MachineRegistrationEditorProps = {
  machine: Machine;
  defaults: {
    country?: string;
    state?: string;
    city?: string;
  };
  currencies: Currency[];
};

export function MachineRegistrationEditor({
  machine,
  defaults,
  currencies,
}: MachineRegistrationEditorProps) {
  const router = useRouter();
  const toast = useToast();
  const [country, setCountry] = useState(machine.country || defaults.country || "USA");
  const [state, setState] = useState(machine.state_region || defaults.state || "");
  const [city, setCity] = useState(machine.city || defaults.city || "");
  const [location, setLocation] = useState(machine.location || "");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [currencyId, setCurrencyId] = useState(
    machine.currency?.id ? String(machine.currency.id) : "",
  );

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    const response = await fetch(`/api/portal/machines/${machine.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        country,
        state,
        city,
        location,
        currencyId,
      }),
    });
    const payload = await response.json().catch(() => null);
    setIsSaving(false);

    if (!response.ok) {
      setError(payload?.message || "Machine data could not be updated.");
      toast({
        title: "Save failed",
        description: payload?.message || "Machine data could not be updated.",
        status: "error",
      });
      return;
    }

    toast({ title: "Machine data saved", status: "success" });
    await router.replace(router.asPath);
  };

  return (
    <Box
      as="form"
      onSubmit={save}
      bg="bg.900"
      border="1px solid"
      borderColor="whiteAlpha.100"
      borderRadius="2xl"
      p="6"
    >
      <VStack spacing="4" align="stretch">
        <Box color="acid.300" fontWeight="800">
          Edit machine settings
        </Box>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing="4">
          <FormControl isRequired>
            <FormLabel>Country</FormLabel>
            <Input value={country} onChange={(event) => setCountry(event.target.value)} />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>State / region</FormLabel>
            <Input value={state} onChange={(event) => setState(event.target.value)} />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>City</FormLabel>
            <Input value={city} onChange={(event) => setCity(event.target.value)} />
          </FormControl>
        </SimpleGrid>
        <FormControl isRequired>
          <FormLabel>Currency</FormLabel>
          <Select
            value={currencyId}
            onChange={(event) => setCurrencyId(event.target.value)}
            placeholder="Select currency"
          >
            {currencies.map((currency) => (
              <option key={currency.id} value={currency.id}>
                {currency.code}{currency.name ? ` — ${currency.name}` : ""}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>Site</FormLabel>
          <Input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Gym, hotel, office, campus, or branch"
          />
          <FormHelperText>
            Saving regenerates the machine title from state, nickname, machine
            type, and owner machine number.
          </FormHelperText>
        </FormControl>
        {error ? (
          <Alert status="error" borderRadius="lg">
            <AlertIcon />
            {error}
          </Alert>
        ) : null}
        <Button
          type="submit"
          variant="primary"
          alignSelf="flex-start"
          isLoading={isSaving}
          isDisabled={!country.trim() || !state.trim() || !city.trim() || !currencyId}
        >
          Save machine data
        </Button>
      </VStack>
    </Box>
  );
}
