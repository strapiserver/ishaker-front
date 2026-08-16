import {
  AspectRatio,
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { FiCheck, FiChevronDown } from "react-icons/fi";
import type {
  PortalCatalogProduct,
  PortalMachineCell,
  PortalProduct,
  PortalProductLine,
  PortalSession,
} from "../../../types/portal";
import type { Machine } from "../../../types/strapi";
import { getMachineContainerCount } from "../../../lib/portal/containerSlots";
import { getSmallestMediaUrl } from "../../../lib/portal/media";
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
  initialMachineId?: string;
  loadError?: string;
};

type MachineSelectorContentProps = {
  machine: Machine;
  accountNickname: string;
  isSelected?: boolean;
};

function MachineSelectorContent({
  machine,
  accountNickname,
  isSelected = false,
}: MachineSelectorContentProps) {
  const previewUrl = getSmallestMediaUrl(machine.machine_type?.preview);
  const title = machine.title || `Machine #${machine.id}`;
  const nickname = machine.nickname || accountNickname;
  const showNickname =
    Boolean(nickname) && !title.toLowerCase().includes(nickname.toLowerCase());

  return (
    <HStack spacing="4" align="center" w="full" minW="0">
      <AspectRatio
        ratio={1}
        boxSize={{ base: "56px", sm: "64px" }}
        flex="0 0 auto"
        bg="bg.800"
        border="1px solid"
        borderColor="whiteAlpha.100"
        borderRadius="lg"
        overflow="hidden"
      >
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt={machine.machine_type?.name || machine.title || "Machine"}
            w="full"
            h="full"
            objectFit="contain"
            p="2"
          />
        ) : (
          <Box />
        )}
      </AspectRatio>

      <VStack spacing="1.5" align="stretch" flex="1" minW="0">
        <Text
          color="bg.50"
          fontWeight="800"
          fontSize={{ base: "md", sm: "lg" }}
          lineHeight="short"
          noOfLines={2}
        >
          {title}
          {showNickname ? ` • ${nickname}` : ""}
        </Text>
        <HStack
          spacing="2"
          color="bg.300"
          fontSize="sm"
          flexWrap="wrap"
          rowGap="0"
        >
          <Text noOfLines={1}>
            Serial: {machine.serial_number || "Not set"}
          </Text>
          {machine.machine_type?.name ? (
            <Text
              noOfLines={1}
              _before={{
                content: '"\u2022"',
                mr: "2",
                color: "whiteAlpha.300",
              }}
            >
              Type: {machine.machine_type.name}
            </Text>
          ) : null}
        </HStack>
      </VStack>

      {isSelected ? (
        <Icon as={FiCheck} color="acid.300" boxSize="5" flex="0 0 auto" />
      ) : null}
    </HStack>
  );
}

export function ProductLinesPage({
  session,
  productLines,
  orphanProducts,
  catalogProducts,
  machineAssignments,
  initialMachineId,
  loadError,
}: ProductLinesPageProps) {
  const router = useRouter();
  const [selectedMachineId, setSelectedMachineId] = useState(
    machineAssignments.some(
      ({ machine }) => String(machine.id) === initialMachineId,
    )
      ? initialMachineId || ""
      : machineAssignments[0]
        ? String(machineAssignments[0].machine.id)
        : "",
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

  const selectMachine = (machineId: string | number) => {
    const nextMachineId = String(machineId);
    setSelectedMachineId(nextMachineId);
    void router.replace(
      `/product-lines/machines/${encodeURIComponent(nextMachineId)}`,
      undefined,
      { shallow: true },
    );
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

      <Box>
        {machineAssignments.length ? (
          <>
            <FormControl maxW="620px" mb="5">
              <FormLabel>Machine for container assignment</FormLabel>
              <Menu matchWidth placement="bottom-start">
                <MenuButton
                  as={Button}
                  w="full"
                  h="auto"
                  minH={{ base: "80px", sm: "92px" }}
                  p={{ base: "3", sm: "3.5" }}
                  bg="bg.900"
                  border="1px solid"
                  borderColor="whiteAlpha.100"
                  borderRadius="lg"
                  textAlign="left"
                  whiteSpace="normal"
                  rightIcon={<FiChevronDown />}
                  _hover={{ bg: "bg.800", borderColor: "whiteAlpha.300" }}
                  _active={{ bg: "bg.800", borderColor: "acid.300" }}
                  _expanded={{ bg: "bg.800", borderColor: "acid.300" }}
                >
                  <MachineSelectorContent
                    machine={selectedAssignment.machine}
                    accountNickname={session.client.company}
                  />
                </MenuButton>
                <MenuList
                  bg="bg.900"
                  borderColor="whiteAlpha.200"
                  p="1.5"
                  maxH="360px"
                  overflowY="auto"
                  zIndex="dropdown"
                >
                  {machineAssignments.map(({ machine }) => {
                    const isSelected =
                      String(machine.id) ===
                      String(selectedAssignment.machine.id);

                    return (
                      <MenuItem
                        key={machine.id}
                        bg={isSelected ? "whiteAlpha.100" : "transparent"}
                        borderRadius="md"
                        p="3"
                        onClick={() => selectMachine(machine.id)}
                        _hover={{ bg: "whiteAlpha.100" }}
                        _focus={{ bg: "whiteAlpha.100" }}
                      >
                        <MachineSelectorContent
                          machine={machine}
                          accountNickname={session.client.company}
                          isSelected={isSelected}
                        />
                      </MenuItem>
                    );
                  })}
                </MenuList>
              </Menu>
            </FormControl>
            <MachineCellsSection
              key={selectedAssignment.machine.id}
              machineId={selectedAssignment.machine.id}
              machineSerial={selectedAssignment.machine.serial_number || null}
              initialCells={selectedCells}
              catalogProducts={catalogProducts}
              loadError={selectedAssignment.loadError}
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

      <SimpleGrid columns={1} spacing="4" mt="10">
        {productLines.map((productLine) => (
          <ProductLineCard key={productLine.id} productLine={productLine} />
        ))}
      </SimpleGrid>

      {!productLines.length && !loadError ? (
        <Text color="bg.300" mt="10">
          No product lines are available yet.
        </Text>
      ) : null}

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
