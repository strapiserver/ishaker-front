import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { FormEvent, useState } from "react";
import type { Client, Machine } from "../../types/strapi";

type Props = {
  client: Client;
  machine: Machine;
};

const statusColor = {
  unconfigured: "gray",
  ok: "green",
  error: "red",
} as const;

export function NayaxSettingsSection({ client, machine }: Props) {
  const toast = useToast();
  const [token, setToken] = useState("");
  const [actorId, setActorId] = useState(client.nayax_actor_id || "");
  const [terminalId, setTerminalId] = useState(
    machine.nayax_terminal_id || "",
  );
  const [status, setStatus] = useState(
    client.nayax_status || "unconfigured",
  );
  const [lastSyncAt] = useState(client.nayax_last_sync_at || "");
  const [error, setError] = useState(client.nayax_error || "");
  const [isSaving, setIsSaving] = useState(false);
  const [tokenSubmitted, setTokenSubmitted] = useState(false);
  const [savedActorId, setSavedActorId] = useState(
    client.nayax_actor_id || "",
  );
  const [savedTerminalId, setSavedTerminalId] = useState(
    machine.nayax_terminal_id || "",
  );

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const replacedToken = Boolean(token.trim());
    const actorChanged = actorId.trim() !== savedActorId;
    const terminalChanged = terminalId.trim() !== savedTerminalId;
    setIsSaving(true);
    setError("");
    const response = await fetch("/api/portal/nayax-settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        machineId: machine.id,
        token,
        actorId,
        terminalId,
      }),
    });
    const payload = await response.json().catch(() => null);
    setIsSaving(false);
    if (!response.ok) {
      const message = payload?.message || "Nayax settings could not be saved.";
      setError(message);
      toast({
        title: "Save failed",
        description: message,
        status: "error",
      });
      return;
    }

    setToken("");
    setTokenSubmitted(replacedToken);
    setStatus(payload?.settings?.status || "unconfigured");
    setSavedActorId(actorId.trim());
    setSavedTerminalId(terminalId.trim());
    toast({
      title: replacedToken ? "Nayax token saved" : "Nayax settings saved",
      description: replacedToken
        ? "The private token was stored and is awaiting the next server sync."
        : actorChanged && terminalChanged
          ? "The actor ID and machine terminal ID were updated."
          : actorChanged
            ? "The Nayax actor ID was updated."
            : "The machine terminal ID was updated.",
      status: "success",
    });
  };

  return (
    <Box
      as="form"
      onSubmit={save}
      bg="bg.900"
      border="1px solid"
      borderColor="whiteAlpha.100"
      borderRadius="2xl"
      p={{ base: "5", md: "6" }}
      mb="6"
    >
      <VStack align="stretch" spacing="4">
        <HStack justify="space-between" align="start">
          <Box>
            <Text color="acid.300" fontWeight="800" fontSize="lg">
              Nayax account
            </Text>
            <Text color="bg.300" mt="1">
              Configure Nayax for {machine.title || machine.serial_number}. The
              API token is shared by your account; the terminal ID maps sales to
              this machine.
            </Text>
          </Box>
          <Badge colorScheme={statusColor[status]}>{status}</Badge>
        </HStack>

        {error ? (
          <Alert status="error" borderRadius="lg">
            <AlertIcon />
            {error}
          </Alert>
        ) : null}
        {tokenSubmitted ? (
          <Alert status="success" borderRadius="lg">
            <AlertIcon />
            Token saved securely. Its value cannot be read back from the portal.
          </Alert>
        ) : null}

        <FormControl isRequired>
          <FormLabel>Nayax API token</FormLabel>
          <Input
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder={
              status === "ok" ? "•••••••• connected — enter to replace" : "Paste token"
            }
            autoComplete="new-password"
          />
          <FormHelperText>
            The token is sent only to this portal&apos;s server and is never returned
            to the browser.
          </FormHelperText>
        </FormControl>
        <FormControl>
          <FormLabel>Nayax actor ID</FormLabel>
          <Input
            value={actorId}
            onChange={(event) => setActorId(event.target.value)}
            placeholder="Optional actor ID"
          />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Terminal ID for this machine</FormLabel>
          <Input
            value={terminalId}
            onChange={(event) => setTerminalId(event.target.value)}
            placeholder="Nayax terminal identifier"
          />
          <FormHelperText>
            Must match the terminal identifier reported for{" "}
            {machine.title || machine.serial_number}.
          </FormHelperText>
        </FormControl>
        {lastSyncAt ? (
          <Text color="bg.300" fontSize="sm">
            Last synchronized: {new Date(lastSyncAt).toLocaleString()}
          </Text>
        ) : null}
        <Button
          type="submit"
          variant="primary"
          alignSelf="flex-start"
          isLoading={isSaving}
          isDisabled={
            !terminalId.trim() ||
            (!token.trim() &&
              actorId.trim() === savedActorId &&
              terminalId.trim() === savedTerminalId)
          }
        >
          Save Nayax settings
        </Button>
      </VStack>
    </Box>
  );
}
