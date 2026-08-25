import { Alert, AlertIcon, Text, VStack } from "@chakra-ui/react";
import type { Machine } from "../../../types/strapi";

export function DoorLockDialogContent({ machine }: { machine: Machine }) {
  if (machine.has_door_lock === true) {
    return (
      <VStack spacing="3" align="stretch">
        <Alert status="success" borderRadius="md">
          <AlertIcon />
          An electric door lock is installed on this machine.
        </Alert>
        <Text color="bg.300">
          Use Open door on the machine page to create a one-day QR code for the
          lock.
        </Text>
      </VStack>
    );
  }

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
