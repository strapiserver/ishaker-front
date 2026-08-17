import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Select,
  SimpleGrid,
  Switch,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import { FaLockOpen } from "react-icons/fa";
import QRCode from "react-qr-code";
import type { Machine } from "../../types/strapi";
import { MachineField } from "./MachineField";

type DoorKeyResponse = {
  payload: string;
  serial: string;
  valid_until: string;
  serial_source: "device" | "record";
  serial_mismatch: boolean;
  scanner_ok: boolean | null;
  has_door_lock: boolean | null;
};

const display = (value: unknown) =>
  value === null || value === undefined || value === "" ? "Not reported" : String(value);

export function MachineDoorUnlockPanel({ machine }: { machine: Machine }) {
  const toast = useToast();
  const [dayOffset, setDayOffset] = useState(0);
  const [doorKey, setDoorKey] = useState<DoorKeyResponse | null>(null);
  const [isIssuing, setIsIssuing] = useState(false);
  const [hasDoorLock, setHasDoorLock] = useState(machine.has_door_lock === true);
  const [isSavingLock, setIsSavingLock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deviceSerial = String(machine.fleet_status?.device_serial || "");
  const mismatch = Boolean(deviceSerial && deviceSerial !== machine.serial_number);

  const issueKey = async () => {
    setIsIssuing(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/machines/${encodeURIComponent(machine.id)}/door-key`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ day_offset: dayOffset }),
        },
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          response.status === 429
            ? "Too many requests. Try again in a minute."
            : body?.error === "serial_unavailable"
              ? "No serial number is available for this machine."
              : "The door code could not be created.",
        );
      }
      setDoorKey(body as DoorKeyResponse);
    } catch (requestError) {
      setDoorKey(null);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The door code could not be created.",
      );
    } finally {
      setIsIssuing(false);
    }
  };

  const updateLock = async (enabled: boolean) => {
    const previous = hasDoorLock;
    setHasDoorLock(enabled);
    setIsSavingLock(true);
    try {
      const response = await fetch(
        `/api/admin/machines/${encodeURIComponent(machine.id)}`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ has_door_lock: enabled }),
        },
      );
      if (!response.ok) throw new Error("update_failed");
      toast({
        title: enabled ? "Door codes enabled" : "Door codes disabled",
        status: "success",
        duration: 2500,
      });
    } catch {
      setHasDoorLock(previous);
      toast({
        title: "The door lock setting could not be saved.",
        status: "error",
        duration: 4000,
      });
    } finally {
      setIsSavingLock(false);
    }
  };

  return (
    <Box
      bg="bg.900"
      border="1px solid"
      borderColor="whiteAlpha.100"
      borderRadius="2xl"
      p={{ base: "5", md: "6" }}
    >
      <HStack justify="space-between" align="flex-start" mb="5" flexWrap="wrap">
        <Box>
          <Text color="acid.300" fontWeight="800">
            Door access
          </Text>
          <Text color="bg.300" fontSize="sm">
            Create a one-day QR code for the electric lock.
          </Text>
        </Box>
        <FormControl display="flex" alignItems="center" width="auto">
          <FormLabel htmlFor="has-door-lock" mb="0" color="bg.200">
            Door codes
          </FormLabel>
          <Switch
            id="has-door-lock"
            colorScheme="green"
            isChecked={hasDoorLock}
            isDisabled={isSavingLock}
            onChange={(event) => void updateLock(event.target.checked)}
          />
        </FormControl>
      </HStack>

      {!hasDoorLock ? (
        <Alert status="warning" borderRadius="lg" mb="5">
          <AlertIcon />
          Door-code access is disabled for this machine. Admin code generation
          remains available for diagnostics.
        </Alert>
      ) : null}
      {machine.fleet_status?.scanner_ok === false ? (
        <Alert status="warning" borderRadius="lg" mb="5">
          <AlertIcon />
          The machine reports that its scanner is unavailable.
        </Alert>
      ) : null}
      {mismatch ? (
        <Alert status="error" borderRadius="lg" mb="5">
          <AlertIcon />
          The recorded and device serial numbers do not match. The QR code will
          use the device serial.
        </Alert>
      ) : null}

      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing="4" mb="5">
        <MachineField label="Recorded serial" value={machine.serial_number} />
        <MachineField label="Device serial" value={display(deviceSerial)} />
        <MachineField
          label="Identity confirmed"
          value={display(machine.fleet_status?.identity_at)}
        />
        <MachineField
          label="Scanner"
          value={`${display(machine.fleet_status?.scanner_ok)} · ${display(
            machine.fleet_status?.scanner_dev,
          )}`}
        />
      </SimpleGrid>

      <HStack align="flex-end" spacing="3" flexWrap="wrap">
        <FormControl maxW="220px">
          <FormLabel color="bg.300">Machine UTC day</FormLabel>
          <Select
            value={dayOffset}
            onChange={(event) => {
              setDayOffset(Number(event.target.value));
              setDoorKey(null);
            }}
          >
            <option value={-1}>Yesterday</option>
            <option value={0}>Today</option>
            <option value={1}>Tomorrow</option>
          </Select>
        </FormControl>
        <Button
          leftIcon={<FaLockOpen />}
          colorScheme="green"
          isLoading={isIssuing}
          onClick={() => void issueKey()}
        >
          Create QR code
        </Button>
      </HStack>

      {error ? (
        <Alert status="error" borderRadius="lg" mt="5">
          <AlertIcon />
          {error}
        </Alert>
      ) : null}

      {doorKey ? (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing="5" mt="5">
          <Box bg="white" borderRadius="xl" p="4" width="100%">
            <QRCode
              value={doorKey.payload}
              level="M"
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            />
          </Box>
          <VStack align="stretch" spacing="3" justify="center">
            <Box>
              <Text color="bg.400" fontSize="sm">Key serial</Text>
              <Text color="bg.50" fontWeight="800">{doorKey.serial}</Text>
            </Box>
            <Box>
              <Text color="bg.400" fontSize="sm">Valid until</Text>
              <Text color="bg.50">{doorKey.valid_until}</Text>
            </Box>
            <HStack>
              <Badge colorScheme={doorKey.serial_source === "device" ? "green" : "orange"}>
                {doorKey.serial_source} serial
              </Badge>
              {doorKey.serial_mismatch ? <Badge colorScheme="red">mismatch</Badge> : null}
            </HStack>
            <Text color="bg.300">Hold this code up to the machine scanner.</Text>
          </VStack>
        </SimpleGrid>
      ) : null}
    </Box>
  );
}
