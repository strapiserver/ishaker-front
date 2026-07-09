import {
  Badge,
  Box,
  Button,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { PortalShell } from "../../components/portal/PortalShell";
import { requirePortalSession } from "../../lib/portal/auth";
import type { PortalMachineSummary, PortalSession } from "../../types/portal";
import type { Machine } from "../../types/strapi";

type MachinesPageProps = {
  session: PortalSession;
  machines: PortalMachineSummary[];
};

const displayValue = (value: unknown, fallback = "Registered") => {
  if (value === null || typeof value === "undefined" || value === "") return fallback;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const text = record.text || record.label || record.name || record.title;
    if (text) return displayValue(text, fallback);
  }

  return fallback;
};

const deriveStatusLabel = (machine: Machine) => {
  if (machine.status === "working") return "Working";
  if (machine.status === "offline") return "Offline";
  if (machine.status === "error") return "Error";
  return displayValue(machine.status);
};

export default function MachinesPage({ session, machines }: MachinesPageProps) {
  return (
    <PortalShell
      title="Machines"
      description="Read-only machine list for the authenticated client. Live telemetry fields can be layered in once the exact manage API endpoints are wired."
      clientName={session.client.company}
    >
      <SimpleGrid columns={{ base: 1, xl: 2 }} spacing="5">
        {machines.map((machine) => (
          <Box
            key={machine.id}
            bg="bg.900"
            border="1px solid"
            borderColor="whiteAlpha.100"
            borderRadius="2xl"
            p="6"
          >
            <Stack spacing="3">
              <Stack direction="row" justify="space-between" align="center">
                <Text color="bg.50" fontWeight="800" fontSize="xl">
                  {machine.title || `Machine #${machine.id}`}
                </Text>
                <Badge colorScheme={machine.status === "working" ? "green" : "gray"}>
                  {machine.statusLabel}
                </Badge>
              </Stack>
              <Text color="bg.300">Serial: {machine.serial_number}</Text>
              {machine.machine_type?.name ? (
                <Text color="bg.300">Type: {machine.machine_type.name}</Text>
              ) : null}
              {machine.last_seen_at ? (
                <Text color="bg.300">Last seen: {new Date(machine.last_seen_at).toLocaleString()}</Text>
              ) : null}
              <Button as={Link} href={`/machines/${machine.id}`} variant="contrast" alignSelf="flex-start">
                Open details
              </Button>
            </Stack>
          </Box>
        ))}
      </SimpleGrid>
    </PortalShell>
  );
}

export const getServerSideProps: GetServerSideProps<MachinesPageProps> = async (context) => {
  const result = await requirePortalSession(context);
  if ("redirect" in result) return { redirect: result.redirect };

  return {
    props: {
      session: result.session,
      machines: result.session.machines.map((machine) => ({
        ...machine,
        statusLabel: deriveStatusLabel(machine),
      })),
    },
  };
};
