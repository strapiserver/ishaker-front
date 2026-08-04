import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Select,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";
import Link from "next/link";
import type {
  PortalCatalogProduct,
  PortalMachineCell,
  PortalProduct,
  PortalProductLine,
  PortalSession,
} from "../../../types/portal";
import type { Machine } from "../../../types/strapi";
import { getMachineContainerCount } from "../../../lib/portal/containerSlots";
import { PortalShell } from "../PortalShell";
import { MachineCellsSection } from "../machines/MachineCellsSection";
import { OrphanProductCard } from "./OrphanProductCard";
import { ProductLineCard } from "./ProductLineCard";

export type MachineContainerAssignment = {
  machine: Machine;
  cells: PortalMachineCell[];
  loadError?: string | null;
};

export type ProductLinesPageProps = {
  session: PortalSession;
  productLines: PortalProductLine[];
  orphanProducts: PortalProduct[];
  catalogProducts: PortalCatalogProduct[];
  machineAssignments: MachineContainerAssignment[];
  loadError?: string;
};

export function ProductLinesPage({
  session,
  productLines,
  orphanProducts,
  catalogProducts,
  machineAssignments,
  loadError,
}: ProductLinesPageProps) {
  const [selectedMachineId, setSelectedMachineId] = useState(
    machineAssignments[0] ? String(machineAssignments[0].machine.id) : "",
  );
  const [machineCells, setMachineCells] = useState<Record<string, PortalMachineCell[]>>(
    () =>
      Object.fromEntries(
        machineAssignments.map(({ machine, cells }) => [String(machine.id), cells]),
      ),
  );
  const selectedAssignment =
    machineAssignments.find(
      ({ machine }) => String(machine.id) === selectedMachineId,
    ) || machineAssignments[0];
  const selectedCells = selectedAssignment
    ? machineCells[String(selectedAssignment.machine.id)] || selectedAssignment.cells
    : [];
  const selectedContainerCount = selectedAssignment
    ? getMachineContainerCount(selectedAssignment.machine.machine_type)
    : null;

  const replaceMachineCells = (
    machineId: string | number,
    cells: PortalMachineCell[],
  ) => {
    setMachineCells((current) => ({
      ...current,
      [String(machineId)]: cells,
    }));
  };

  return (
    <PortalShell
      title="Product lines"
      description="Manage your drink and flavour library, then assign products to physical machine containers."
      clientName={session.client.company}
      access={session.access}
      showSupportBanner={false}
      headerAction={
        <Button
          as={Link}
          href="/product-lines/new"
          bg="#69e65d"
          color="#071008"
          size="md"
          px="5"
          fontWeight="700"
          boxShadow="0 8px 24px rgba(70, 220, 84, 0.18)"
          _hover={{ bg: "#80ef75", transform: "translateY(-1px)" }}
        >
          +&nbsp; New product line
        </Button>
      }
    >
      {loadError ? (
        <Text color="orange.200" mb="5">
          {loadError}
        </Text>
      ) : null}

      <SimpleGrid columns={1} spacing="4">
        {productLines.map((productLine) => (
          <ProductLineCard key={productLine.id} productLine={productLine} />
        ))}
      </SimpleGrid>

      {!productLines.length && !loadError ? (
        <Text color="bg.300">No product lines are available yet.</Text>
      ) : null}

      <Box mt="10">
        {machineAssignments.length ? (
          <>
            <FormControl maxW="420px" mb="5">
              <FormLabel>Machine for container assignment</FormLabel>
              <Select
                value={String(selectedAssignment.machine.id)}
                bg="bg.900"
                onChange={(event) => setSelectedMachineId(event.target.value)}
              >
                {machineAssignments.map(({ machine }) => (
                  <option key={machine.id} value={machine.id}>
                    {machine.title || `Machine #${machine.id}`}
                    {machine.serial_number
                      ? ` — ${machine.serial_number}`
                      : ""}
                  </option>
                ))}
              </Select>
            </FormControl>
            <MachineCellsSection
              key={selectedAssignment.machine.id}
              machineId={selectedAssignment.machine.id}
              machineSerial={selectedAssignment.machine.serial_number || null}
              initialCells={selectedCells}
              catalogProducts={catalogProducts}
              loadError={selectedAssignment.loadError}
              currency={
                selectedAssignment.machine.currency || session.client.currency
              }
              containerCount={selectedContainerCount}
              onCellsSaved={(cells) =>
                replaceMachineCells(selectedAssignment.machine.id, cells)
              }
            />
          </>
        ) : (
          <Text color="orange.200">
            Register a machine before assigning products to containers.
          </Text>
        )}
      </Box>

      {orphanProducts.length ? (
        <Box mt="10">
          <Heading as="h2" fontSize="xl" mb="2">
            Orphan products
          </Heading>
          <Text color="orange.200" mb="4">
            Legacy flavours detached by the old edit flow. Attach one to recover
            it, or delete it and its machine or preset container assignments.
            This section disappears when no orphan products remain.
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing="4">
            {orphanProducts.map((product) => (
              <OrphanProductCard
                key={product.id}
                product={product}
                productLines={productLines}
              />
            ))}
          </SimpleGrid>
        </Box>
      ) : null}
    </PortalShell>
  );
}

export { CupPreview } from "./CupPreview";
export { ContainersPreview } from "./ContainersPreview";
export type { ContainersPreviewProps } from "./ContainersPreview";
export { DeleteProductDialog } from "./DeleteProductDialog";
export { DeleteProductLineDialog } from "./DeleteProductLineDialog";
export { NewProductPage } from "./new-product";
export type { NewProductPageProps } from "./new-product";
export { NewProductLinePage } from "./NewProductLinePage";
export type { NewProductLinePageProps } from "./NewProductLinePage";
export { ProductLineCard } from "./ProductLineCard";
export { ProductCard } from "./ProductCard";
export { PowderContainer } from "./PowderContainer";
export type { PowderContainerProps } from "./PowderContainer";
export { OrphanProductCard } from "./OrphanProductCard";
export { ProductLineForm } from "./ProductLineForm";
export { SearchableImageSelect } from "./SearchableImageSelect";
export type {
  SearchableImageOption,
  SearchableImageSelectProps,
} from "./SearchableImageSelect";
