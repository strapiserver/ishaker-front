import {
  AspectRatio,
  Badge,
  Box,
  Button,
  SimpleGrid,
  HStack,
  VStack,
  Text,
  Icon,
  Image,
} from "@chakra-ui/react";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { PortalShell } from "../../components/portal/PortalShell";
import { requirePortalSession } from "../../lib/portal/auth";
import { getSmallestMediaUrl } from "../../lib/portal/media";
import type { PortalMachineSummary, PortalSession } from "../../types/portal";
import type { Machine } from "../../types/strapi";
import { FaPlus } from "react-icons/fa";

type MachinesPageProps = {
  session: PortalSession;
  machines: PortalMachineSummary[];
};

const displayValue = (value: unknown, fallback = "Registered") => {
  if (value === null || typeof value === "undefined" || value === "")
    return fallback;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
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
      description="All machines registered to your account. You can create new product lines for each machine."
      clientName={session.client.company}
    >
      <Button
        as={Link}
        href={
          machines[0]
            ? `/product-lines/new?machineId=${machines[0].id}`
            : "/product-lines/new"
        }
        variant="primary"
        w="full"
        mb="8"
        fontSize={{ base: "lg", md: "xl" }}
        leftIcon={<Icon as={FaPlus} boxSize={{ base: "5", md: "7" }} />}
      >
        New product line
      </Button>

      <SimpleGrid columns={{ base: 1, xl: 2 }} spacing="5">
        {machines.map((machine) => {
          const previewUrl = getSmallestMediaUrl(machine.machine_type?.preview);

          return (
            <Box
              key={machine.id}
              bg="bg.900"
              border="1px solid"
              borderColor="whiteAlpha.100"
              borderRadius="2xl"
              p="6"
            >
              <VStack spacing="3" align="stretch">
                {previewUrl ? (
                  <AspectRatio
                    ratio={1}
                    w="96px"
                    bg="bg.800"
                    borderRadius="xl"
                    overflow="hidden"
                  >
                    <Image
                      src={previewUrl}
                      alt={
                        machine.machine_type?.name || machine.title || "Machine"
                      }
                      w="full"
                      h="full"
                      objectFit="contain"
                      p="2"
                    />
                  </AspectRatio>
                ) : null}
                <HStack justify="space-between" align="center">
                  <Text color="bg.50" fontWeight="800" fontSize="xl">
                    {machine.title || `Machine #${machine.id}`}
                  </Text>
                  <Badge
                    colorScheme={
                      machine.status === "working" ? "green" : "gray"
                    }
                  >
                    {machine.statusLabel}
                  </Badge>
                </HStack>
                <Text color="bg.300">Serial: {machine.serial_number}</Text>
                {machine.machine_type?.name ? (
                  <Text color="bg.300">Type: {machine.machine_type.name}</Text>
                ) : null}
                {machine.last_seen_at ? (
                  <Text color="bg.300">
                    Last seen: {new Date(machine.last_seen_at).toLocaleString()}
                  </Text>
                ) : null}
                <Button
                  as={Link}
                  href={`/machines/${machine.id}`}
                  variant="contrast"
                  alignSelf="flex-start"
                >
                  Open details
                </Button>
                <Button
                  as={Link}
                  href={`/product-lines/new?machineId=${machine.id}`}
                  variant="ghost"
                  alignSelf="flex-start"
                >
                  New product line for this machine
                </Button>
              </VStack>
            </Box>
          );
        })}
      </SimpleGrid>
    </PortalShell>
  );
}

export const getServerSideProps: GetServerSideProps<MachinesPageProps> = async (
  context,
) => {
  const result = await requirePortalSession(context);
  if ("redirect" in result) return { redirect: result.redirect };
  if (result.session.access === "product") {
    return {
      redirect: {
        destination: "/product-lines",
        permanent: false,
      },
    };
  }

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
