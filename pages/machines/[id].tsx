import {
  Box,
  SimpleGrid,
  VStack,
  Table,
  Tbody,
  Td,
  Text,
  Tr,
} from "@chakra-ui/react";
import type { GetServerSideProps } from "next";
import { MachineCellsSection } from "../../components/portal/machines/MachineCellsSection";
import { PortalShell } from "../../components/portal/PortalShell";
import { requirePortalSession } from "../../lib/portal/auth";
import {
  getMachineCatalogProducts,
  getMachineCells,
} from "../../services/server/machineCells";
import {
  getTelemetryMachineHome,
  getTelemetryMachinePrices,
  getTelemetryMachineStatus,
  getTelemetryMachineStorage,
  isTelemetryConfigured,
  resolveTelemetryMachine,
} from "../../services/server/telemetryClient";
import type {
  PortalCatalogProduct,
  PortalMachineCell,
  PortalSession,
} from "../../types/portal";
import type { Machine } from "../../types/strapi";

type MachineDetailPageProps = {
  session: PortalSession;
  machine: Machine;
  cells: PortalMachineCell[];
  catalogProducts: PortalCatalogProduct[];
  cellsLoadError?: string | null;
  telemetryConfigured: boolean;
  telemetryConnected?: boolean;
  telemetryOrganizationId?: number | null;
  telemetryReason?: string | null;
  telemetryStatus?: any | null;
  telemetryHome?: any | null;
  telemetryStorage?: any | null;
  telemetryPrices?: any[] | null;
};

const displayValue = (value: unknown, fallback = "-"): string => {
  if (value === null || typeof value === "undefined" || value === "") return fallback;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => displayValue(item)).join(", ");
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const text = record.text || record.label || record.name || record.title || record.productName;
    const date = record.date || record.updatedAt || record.createdAt;

    if (text && date) return `${displayValue(text)} (${displayValue(date)})`;
    if (text) return displayValue(text);

    try {
      return JSON.stringify(value);
    } catch {
      return fallback;
    }
  }

  return fallback;
};

const rows = (machine: Machine) => [
  ["Title", displayValue(machine.title)],
  ["Serial number", displayValue(machine.serial_number)],
  ["Status", displayValue(machine.status)],
  ["Machine type", displayValue(machine.machine_type?.name)],
  ["Hostname", displayValue(machine.hostname)],
  ["AnyDesk ID", displayValue(machine.anydesk_id)],
  ["Tailscale IP", displayValue(machine.tailscale_ip)],
  ["Unity version", displayValue(machine.unity_version)],
  ["SSD version", displayValue(machine.ssd_version)],
  ["Bootstrap version", displayValue(machine.bootstrap_version)],
];

export default function MachineDetailPage({
  session,
  machine,
  cells,
  catalogProducts,
  cellsLoadError,
  telemetryConfigured,
  telemetryConnected,
  telemetryOrganizationId,
  telemetryReason,
  telemetryStatus,
  telemetryHome,
  telemetryStorage,
  telemetryPrices,
}: MachineDetailPageProps) {
  return (
    <PortalShell
      title={machine.title || "Machine detail"}
      description="Machine access is scoped to the signed-in client. Live telemetry appears here once the frontend server is configured for the manage.ishakerusa.com API."
      clientName={session.client.company}
    >
      <SimpleGrid columns={{ base: 1, xl: 2 }} spacing="6">
        <Box bg="bg.900" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl" p="6">
          <Text color="acid.300" fontWeight="800" mb="4">
            Machine metadata
          </Text>
          <Table variant="simple" colorScheme="whiteAlpha">
            <Tbody>
              {rows(machine).map(([label, value]) => (
                <Tr key={label}>
                  <Td color="bg.300" pl="0">{label}</Td>
                  <Td color="bg.50" pr="0">{value}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>

        <Box bg="bg.900" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl" p="6">
          <VStack spacing="3" align="stretch">
            <Text color="acid.300" fontWeight="800">
              Telemetry connection
            </Text>
            {!telemetryConfigured ? (
              <>
                <Text color="orange.200">
                  Live telemetry is not configured on this frontend server.
                </Text>
                <Text color="bg.300">
                  Missing env vars: `TELEMETRY_API_BASE`, `TELEMETRY_KEYCLOAK_TOKEN_URL`, `TELEMETRY_CLIENT_ID`, `TELEMETRY_SERVICE_USERNAME`, `TELEMETRY_SERVICE_PASSWORD`.
                </Text>
              </>
            ) : telemetryReason ? (
              <>
                <Text color="green.300">
                  Telemetry API connection is working.
                </Text>
                {telemetryOrganizationId ? (
                  <Text color="bg.300">Resolved organization id: {telemetryOrganizationId}</Text>
                ) : null}
                <Text color="orange.200">Telemetry machine could not be resolved.</Text>
                <Text color="bg.300">Reason: {telemetryReason}</Text>
                <Text color="bg.300">Strapi serial number: {machine.serial_number || "-"}</Text>
              </>
            ) : (
              <>
                <Text color="green.300">
                  Telemetry API connection is working.
                </Text>
                {telemetryOrganizationId ? (
                  <Text color="bg.300">Resolved organization id: {telemetryOrganizationId}</Text>
                ) : null}
                <Text color="bg.300">
                  Status: {displayValue(telemetryStatus?.status || telemetryHome?.status, "Connected")}
                </Text>
                {typeof telemetryHome?.applicationVersion !== "undefined" ? (
                  <Text color="bg.300">
                    App version: {displayValue(telemetryHome.applicationVersion)}
                  </Text>
                ) : null}
                {typeof telemetryHome?.isActiveKiosk !== "undefined" ? (
                  <Text color="bg.300">
                    Kiosk active: {telemetryHome.isActiveKiosk ? "Yes" : "No"}
                  </Text>
                ) : null}
                {telemetryStorage ? (
                  <Text color="bg.300">
                    Storage payload received: {Object.keys(telemetryStorage).length} fields
                  </Text>
                ) : null}
              </>
            )}
          </VStack>
        </Box>

        <MachineCellsSection
          machineId={machine.id}
          initialCells={cells}
          catalogProducts={catalogProducts}
          loadError={cellsLoadError}
        />

        {telemetryPrices?.length ? (
          <Box bg="bg.900" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl" p="6" gridColumn={{ xl: "1 / -1" }}>
            <Text color="acid.300" fontWeight="800" mb="4">
              Prices
            </Text>
            <Table variant="simple" colorScheme="whiteAlpha">
              <Tbody>
                {telemetryPrices.slice(0, 20).map((price, index) => (
                  <Tr key={index}>
                    <Td color="bg.300" pl="0">
                      {displayValue(
                        price?.name || price?.title || price?.productName,
                        `Item ${index + 1}`,
                      )}
                    </Td>
                    <Td color="bg.50" pr="0">
                      {typeof price?.price !== "undefined"
                        ? displayValue(price.price)
                        : displayValue(price)}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        ) : null}
      </SimpleGrid>
    </PortalShell>
  );
}

export const getServerSideProps: GetServerSideProps<MachineDetailPageProps> = async (context) => {
  const result = await requirePortalSession(context);
  if ("redirect" in result) return { redirect: result.redirect };

  const machineId = Array.isArray(context.params?.id) ? context.params?.id[0] : context.params?.id;
  const machine = result.session.machines.find((item) => String(item.id) === String(machineId));

  if (!machine) {
    return { notFound: true };
  }

  const telemetryConfigured = isTelemetryConfigured();
  let cells: PortalMachineCell[] = [];
  let catalogProducts: PortalCatalogProduct[] = [];
  let cellsLoadError: string | null = null;
  try {
    [cells, catalogProducts] = await Promise.all([
      getMachineCells(machine.id),
      getMachineCatalogProducts(machine.id, result.session.client.id),
    ]);
  } catch (error) {
    console.error("[machines/detail] container loading failed:", error);
    cellsLoadError = "Machine containers could not be loaded.";
  }

  const commonProps = {
    session: result.session,
    machine,
    telemetryConfigured,
    cells,
    catalogProducts,
    cellsLoadError,
  };

  if (!telemetryConfigured) {
    return {
      props: {
        ...commonProps,
        telemetryConnected: false,
      },
    };
  }

  try {
    const resolved = await resolveTelemetryMachine({
      client: result.session.client,
      serialNumber: machine.serial_number,
    });

    if (!resolved.machineId) {
      return {
        props: {
          ...commonProps,
          telemetryConnected: true,
          telemetryOrganizationId: resolved.organizationId,
          telemetryReason: resolved.reason,
        },
      };
    }

    const [telemetryStatus, telemetryHome, telemetryStorage, telemetryPrices] =
      await Promise.all([
        getTelemetryMachineStatus(resolved.machineId).catch(() => null),
        getTelemetryMachineHome(resolved.machineId).catch(() => null),
        getTelemetryMachineStorage(resolved.machineId).catch(() => null),
        getTelemetryMachinePrices(resolved.machineId).catch(() => null),
      ]);

    return {
      props: {
        ...commonProps,
        telemetryConnected: true,
        telemetryOrganizationId: resolved.organizationId,
        telemetryStatus,
        telemetryHome,
        telemetryStorage,
        telemetryPrices: Array.isArray(telemetryPrices) ? telemetryPrices : null,
        telemetryReason: null,
      },
    };
  } catch (error) {
    console.error("[machines/detail] telemetry load failed:", error);
    return {
      props: {
        ...commonProps,
        telemetryConnected: false,
        telemetryReason: "telemetry_request_failed",
      },
    };
  }
};
