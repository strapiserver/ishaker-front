import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  HStack,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import QRCode from "react-qr-code";
import type { Machine } from "../../../types/strapi";

type DoorKeyResponse = {
  payload: string;
  serial: string;
  valid_until: string;
  serial_source: "device" | "record";
  serial_mismatch: boolean;
  scanner_ok: boolean | null;
};

const remainingLabel = (validUntil: string, now: number) => {
  const remaining = Math.max(0, Date.parse(validUntil) - now);
  const totalMinutes = Math.ceil(remaining / 60_000);
  return {
    expired: remaining <= 0,
    label: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
  };
};

export function DoorLockDialogContent({ machine }: { machine: Machine }) {
  const [doorKey, setDoorKey] = useState<DoorKeyResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const issueKey = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/portal/machines/${encodeURIComponent(machine.id)}/door-key`,
        { method: "POST" },
      );
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 409 && body?.error === "no_door_lock") {
          throw new Error(
            "This machine does not have an electric door lock installed.",
          );
        }
        if (response.status === 429) {
          throw new Error("Too many requests. Try again in a minute.");
        }
        throw new Error(
          body?.error === "serial_unavailable"
            ? "The machine serial number is unavailable. Contact support."
            : "The door code could not be created. Please try again.",
        );
      }

      setDoorKey(body as DoorKeyResponse);
      setNow(Date.now());
    } catch (requestError) {
      setDoorKey(null);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The door code could not be created. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [machine.id]);

  useEffect(() => {
    if (machine.has_door_lock === true) void issueKey();
  }, [issueKey, machine.has_door_lock]);

  useEffect(() => {
    if (!doorKey) return;
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, [doorKey]);

  if (machine.has_door_lock !== true) {
    return (
      <Alert
        status={machine.has_door_lock === false ? "info" : "warning"}
        borderRadius="md"
      >
        <AlertIcon />
        {machine.has_door_lock === false
          ? "This machine does not have an electric door lock installed."
          : "Door lock information is unavailable."}
      </Alert>
    );
  }

  const validity = doorKey
    ? remainingLabel(doorKey.valid_until, now)
    : { expired: false, label: "" };

  return (
    <VStack spacing="4" align="stretch">
      {doorKey?.scanner_ok === false ? (
        <Alert status="warning" borderRadius="lg" alignItems="flex-start">
          <AlertIcon mt="1" />
          The machine cannot see its scanner, so it cannot read this code.
          Contact support.
        </Alert>
      ) : null}

      {error ? (
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          {error}
        </Alert>
      ) : null}

      {isLoading && !doorKey ? (
        <Box py="16" textAlign="center">
          <Spinner size="xl" color="green.300" />
          <Text mt="3" color="bg.300">
            Creating door code…
          </Text>
        </Box>
      ) : doorKey && !validity.expired ? (
        <Box bg="white" borderRadius="xl" p="4" width="100%">
          <QRCode
            value={doorKey.payload}
            level="M"
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
          />
        </Box>
      ) : doorKey && validity.expired ? (
        <Box
          border="1px dashed"
          borderColor="whiteAlpha.300"
          borderRadius="xl"
          py="16"
          textAlign="center"
        >
          <Text color="bg.300">This code has expired.</Text>
        </Box>
      ) : null}

      {doorKey ? (
        <VStack spacing="2" align="start">
          <Text color="bg.300">
            Hold this code up to the machine scanner.
          </Text>
          <HStack spacing="2" flexWrap="wrap">
            <Badge
              colorScheme={
                doorKey.serial_source === "device" ? "green" : "orange"
              }
            >
              {doorKey.serial_source} serial
            </Badge>
            {doorKey.serial_mismatch ? (
              <Badge colorScheme="red">mismatch</Badge>
            ) : null}
          </HStack>
          <Text color="bg.500" fontSize="xs">
            Serial number: {doorKey.serial}
          </Text>
          <Text color={validity.expired ? "red.300" : "bg.500"} fontSize="xs">
            {validity.expired
              ? "Code expired"
              : `Code valid for another ${validity.label}`}
          </Text>
        </VStack>
      ) : null}

      <Button
        colorScheme="green"
        alignSelf="flex-end"
        onClick={() => void issueKey()}
        isLoading={isLoading}
        loadingText="Creating"
      >
        {error || validity.expired ? "Try again" : "Refresh code"}
      </Button>
    </VStack>
  );
}
