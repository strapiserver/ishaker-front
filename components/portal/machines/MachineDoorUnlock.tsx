import {
  Alert,
  AlertIcon,
  Box,
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { FaLockOpen } from "react-icons/fa";
import QRCode from "react-qr-code";
import type { Machine } from "../../../types/strapi";
import { ResponsiveText } from "../../../styles/theme/custom";

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

export function MachineDoorUnlock({ machine }: { machine: Machine }) {
  const modal = useDisclosure();
  const [doorKey, setDoorKey] = useState<DoorKeyResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!modal.isOpen) return;
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, [modal.isOpen]);

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

  if (machine.has_door_lock !== true) return null;

  const validity = doorKey
    ? remainingLabel(doorKey.valid_until, now)
    : { expired: false, label: "" };

  const openModal = () => {
    modal.onOpen();
    void issueKey();
  };

  return (
    <>
      <Modal isOpen={modal.isOpen} onClose={modal.onClose} isCentered size="sm">
        <ModalOverlay />
        <ModalContent bg="bg.900" color="bg.50">
          <ModalHeader>Open machine door</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing="4" align="stretch" fontSize="xs">
              {doorKey?.scanner_ok === false ? (
                <Alert
                  status="warning"
                  borderRadius="lg"
                  alignItems="flex-start"
                >
                  <AlertIcon mt="1" />
                  The machine cannot see its scanner, so it cannot read this
                  code. Contact support.
                </Alert>
              ) : null}

              {error ? (
                <Alert status="error" borderRadius="lg">
                  <AlertIcon />
                  {error}
                </Alert>
              ) : null}

              {doorKey && !validity.expired ? (
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
                <VStack spacing="1" justify="start" align="start">
                  <Text color="bg.300" fontSize="md">
                    Hold this code up to the machine scanner.
                  </Text>
                  {doorKey.serial_source === "record" ||
                  doorKey.serial_mismatch ? (
                    <Text color="orange.200" fontSize="xs" textAlign="center">
                      The machine serial has not been confirmed. If the code
                      does not work, contact support.
                    </Text>
                  ) : null}
                  <Text
                    color={validity.expired ? "red.300" : "bg.500"}
                    fontSize="xs"
                  >
                    Serial number: {doorKey.serial}
                  </Text>
                  <Text
                    color={validity.expired ? "red.300" : "bg.500"}
                    fontSize="xs"
                  >
                    {validity.expired
                      ? "Code expired"
                      : `Code valid for another ${validity.label}`}
                  </Text>
                </VStack>
              ) : null}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack width="100%" justify="flex-end">
              <Button variant="ghost" onClick={modal.onClose}>
                Close
              </Button>
              <Button
                colorScheme="green"
                onClick={() => void issueKey()}
                isLoading={isLoading}
                loadingText="Creating"
              >
                {error ? "Try again" : "Refresh"}
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
