import {
  AspectRatio,
  Badge,
  Box,
  Button,
  SimpleGrid,
  HStack,
  Stack,
  VStack,
  Text,
  Icon,
  Image,
} from "@chakra-ui/react";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { useEffect, useMemo, useState } from "react";
import { PortalShell } from "../../components/portal/PortalShell";
import { MachineHealthStrip } from "../../components/portal/machines/MachineHealthStrip";
import { requirePortalSession } from "../../lib/portal/auth";
import { getSmallestMediaUrl } from "../../lib/portal/media";
import type { PortalMachineSummary, PortalSession } from "../../types/portal";
import type { Machine } from "../../types/strapi";
import type { MachineHealthRow } from "../../types/machineHealth";
import { FaArrowRight, FaPlus, FaWrench } from "react-icons/fa";

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
  const [healthRows, setHealthRows] = useState<MachineHealthRow[]>([]);
  const [isHealthLoading, setIsHealthLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadHealth = async () => {
      try {
        const response = await fetch("/api/portal/machines/health", {
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new Error("Machine health could not be loaded.");
        if (!cancelled) {
          setHealthRows(Array.isArray(payload?.machines) ? payload.machines : []);
        }
      } catch (error) {
        console.error("[machines] health loading failed:", error);
      } finally {
        if (!cancelled) setIsHealthLoading(false);
      }
    };

    void loadHealth();
    return () => {
      cancelled = true;
    };
  }, []);

  const healthByMachineId = useMemo(
    () => new Map(healthRows.map((row) => [String(row.id), row])),
    [healthRows],
  );

  return (
    <PortalShell
      title="Machines"
      description="All machines registered to your account. Assign library products to their physical containers."
      clientName={session.client.company}
    >
      <HStack spacing="3" mb="6" flexWrap="wrap">
        <Button
          as={Link}
          href={
            machines[0]
              ? `/product-lines/new?machineId=${machines[0].id}`
              : "/product-lines/new"
          }
          variant="primary"
          fontSize={{ base: "md", md: "lg" }}
          leftIcon={<Icon as={FaPlus} boxSize={{ base: "4", md: "5" }} />}
        >
          New product line
        </Button>
        <Button
          as={Link}
          href="/step1"
          variant="contrast"
          fontSize={{ base: "md", md: "lg" }}
          leftIcon={<Icon as={FaWrench} boxSize={{ base: "4", md: "5" }} />}
        >
          Register another machine
        </Button>
      </HStack>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="4">
        {machines.map((machine) => {
          const previewUrl = getSmallestMediaUrl(machine.machine_type?.preview);

          return (
            <Box
              key={machine.id}
              bg="bg.900"
              border="1px solid"
              borderColor="whiteAlpha.100"
              borderRadius="xl"
              p={{ base: "4", md: "5" }}
              transition="border-color 160ms ease, transform 160ms ease"
              _hover={{
                borderColor: "whiteAlpha.300",
                transform: "translateY(-1px)",
              }}
            >
              <VStack spacing="4" align="stretch" h="full">
                <HStack spacing="4" align="flex-start">
                  <AspectRatio
                    ratio={1}
                    boxSize={{ base: "68px", sm: "76px" }}
                    flex="0 0 auto"
                    bg="bg.800"
                    border="1px solid"
                    borderColor="whiteAlpha.50"
                    borderRadius="lg"
                    overflow="hidden"
                  >
                    {previewUrl ? (
                      <Image
                        src={previewUrl}
                        alt={
                          machine.machine_type?.name ||
                          machine.title ||
                          "Machine"
                        }
                        w="full"
                        h="full"
                        objectFit="contain"
                        p="2"
                      />
                    ) : (
                      <Box />
                    )}
                  </AspectRatio>

                  <VStack spacing="2" align="stretch" flex="1" minW="0">
                    <HStack
                      justify="space-between"
                      align="flex-start"
                      spacing="3"
                    >
                      <Text
                        color="bg.50"
                        fontWeight="800"
                        fontSize={{ base: "lg", md: "xl" }}
                        lineHeight="short"
                        noOfLines={1}
                      >
                        {machine.title || `Machine #${machine.id}`}
                      </Text>
                      <Badge
                        flexShrink={0}
                        colorScheme="gray"
                      >
                        Record: {machine.statusLabel}
                      </Badge>
                    </HStack>

                    <Stack
                      direction={{ base: "column", sm: "row" }}
                      spacing={{ base: "1", sm: "3" }}
                      color="bg.300"
                      fontSize="sm"
                    >
                      <Text noOfLines={1}>Serial: {machine.serial_number}</Text>
                      {machine.machine_type?.name ? (
                        <Text
                          noOfLines={1}
                          _before={{
                            content: { base: '""', sm: '"•"' },
                            mr: { base: "0", sm: "3" },
                            color: "whiteAlpha.300",
                          }}
                        >
                          Type: {machine.machine_type.name}
                        </Text>
                      ) : null}
                    </Stack>
                    {machine.last_seen_at ? (
                      <Text color="bg.400" fontSize="xs" noOfLines={1}>
                        Last seen:{" "}
                        {new Date(machine.last_seen_at).toLocaleString()}
                      </Text>
                    ) : null}
                  </VStack>
                </HStack>

                <MachineHealthStrip
                  health={healthByMachineId.get(String(machine.id))}
                  isLoading={isHealthLoading}
                />

                <HStack
                  spacing="2"
                  pt="3"
                  mt="auto"
                  borderTop="1px solid"
                  borderColor="whiteAlpha.100"
                  flexWrap="wrap"
                >
                  <Button
                    as={Link}
                    href={`/machines/${machine.id}`}
                    variant="contrast"
                    size="sm"
                    rightIcon={<Icon as={FaArrowRight} boxSize="3" />}
                  >
                    Open details
                  </Button>
                  <Button
                    as={Link}
                    href={`/product-lines`}
                    variant="ghost"
                    size="sm"
                    leftIcon={<Icon as={FaPlus} boxSize="3" />}
                  >
                    Add product line
                  </Button>
                </HStack>
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
