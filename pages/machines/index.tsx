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
  IconButton,
} from "@chakra-ui/react";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PortalShell } from "../../components/portal/PortalShell";
import { MachineHealthStrip } from "../../components/portal/machines/MachineHealthStrip";
import { RemoteAccessDialog } from "../../components/portal/machines/RemoteAccessDialog";
import { requirePortalSession } from "../../lib/portal/auth";
import { getSmallestMediaUrl } from "../../lib/portal/media";
import type { PortalMachineSummary, PortalSession } from "../../types/portal";
import type { Machine } from "../../types/strapi";
import type { MachineHealthRow } from "../../types/machineHealth";
import { FaPlus, FaWrench } from "react-icons/fa";
import { MdAddToHomeScreen } from "react-icons/md";
import { Box3D } from "../../styles/theme/custom";
import { ImInfo } from "react-icons/im";
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
  const [remoteMachine, setRemoteMachine] = useState<Machine | null>(null);

  const loadHealth = useCallback(async (showLoading = false) => {
    if (showLoading) setIsHealthLoading(true);
    try {
      const response = await fetch("/api/portal/machines/health", {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error("Machine health could not be loaded.");
      setHealthRows(Array.isArray(payload?.machines) ? payload.machines : []);
    } catch (error) {
      console.error("[machines] health loading failed:", error);
    } finally {
      setIsHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHealth(true);
  }, [loadHealth]);

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
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="4">
        {machines.map((machine) => {
          const previewUrl = getSmallestMediaUrl(machine.machine_type?.preview);

          return (
            <Box3D
              key={machine.id}
              variant="no_contrast"
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
                    </HStack>
                    <HStack justify="space-between" spacing="3" flexWrap="wrap">
                      <Stack
                        direction={{ base: "column", sm: "row" }}
                        spacing={{ base: "1", sm: "3" }}
                        color="bg.300"
                        fontSize="sm"
                      >
                        <Text noOfLines={1}>
                          Serial: {machine.serial_number}
                        </Text>
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
                      <IconButton
                        as={Link}
                        href={`/machines/${machine.id}`}
                        aria-label={`Open details for ${machine.title || `machine ${machine.id}`}`}
                        icon={<ImInfo />}
                        variant="contrast"
                      />
                    </HStack>
                    {machine.last_seen_at ? (
                      <Text color="bg.400" fontSize="xs" noOfLines={1}>
                        Last seen:{" "}
                        {new Date(machine.last_seen_at).toLocaleString()}
                      </Text>
                    ) : null}
                  </VStack>
                </HStack>

                <MachineHealthStrip
                  machine={machine}
                  health={healthByMachineId.get(String(machine.id))}
                  isLoading={isHealthLoading}
                  onHealthChanged={() => void loadHealth()}
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
                    variant="contrast"
                    as={Link}
                    href={`/product-lines/machines/${machine.id}`}
                    size="sm"
                    rightIcon={<Icon as={FaPlus} boxSize="3" />}
                  >
                    Add product
                  </Button>
                  <Button
                    variant="contrast"
                    size="sm"
                    rightIcon={<Icon as={MdAddToHomeScreen} boxSize="3" />}
                    onClick={() => setRemoteMachine(machine)}
                  >
                    Remote access
                  </Button>
                </HStack>
              </VStack>
            </Box3D>
          );
        })}
      </SimpleGrid>
      <HStack spacing="3" mt="6" flexWrap="nowrap" align="stretch" mx="2">
        <Button
          w="100%"
          my="2"
          borderRadius="2xl"
          border="3px dashed"
          borderColor="bg.500"
          as={Link}
          href="/step1"
          variant="ghost"
          fontSize={{ base: "xs", sm: "md", md: "lg" }}
          px={{ base: "3", sm: "4" }}
          minW="0"
          minH="50px"
          leftIcon={<Icon as={FaPlus} boxSize={{ base: "4", md: "5" }} />}
        >
          Register another machine
        </Button>
      </HStack>
      <RemoteAccessDialog
        machine={remoteMachine}
        isOpen={Boolean(remoteMachine)}
        onClose={() => setRemoteMachine(null)}
      />
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
