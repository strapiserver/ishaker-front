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
  Switch,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import type {
  PortalCatalogProduct,
  PortalMachineCell,
} from "../../../types/portal";

type MachineCellsSectionProps = {
  machineId: string | number;
  initialCells: PortalMachineCell[];
  catalogProducts: PortalCatalogProduct[];
  loadError?: string | null;
};

const productLabel = (product: PortalCatalogProduct) => {
  const taste = product.taste?.name?.trim();
  return taste && taste.toLocaleLowerCase() !== product.name.toLocaleLowerCase()
    ? `${taste} — ${product.name}`
    : taste || product.name;
};

export function MachineCellsSection({
  machineId,
  initialCells,
  catalogProducts,
  loadError,
}: MachineCellsSectionProps) {
  const toast = useToast();
  const [cells, setCells] = useState(
    [...initialCells]
      .sort((left, right) => left.position - right.position)
      .map((cell) => ({
        ...cell,
        productId: cell.product ? String(cell.product.id) : "",
      })),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const productsById = useMemo(
    () => new Map(catalogProducts.map((product) => [String(product.id), product])),
    [catalogProducts],
  );

  const duplicateProductIds = useMemo(() => {
    const counts = new Map<string, number>();
    cells.forEach((cell) => {
      if (cell.isActive && cell.productId) {
        counts.set(cell.productId, (counts.get(cell.productId) || 0) + 1);
      }
    });
    return new Set(
      [...counts.entries()].filter(([, count]) => count > 1).map(([id]) => id),
    );
  }, [cells]);

  const categoryMismatchPositions = useMemo(
    () =>
      cells
        .filter((cell) => {
          const product = productsById.get(cell.productId);
          return Boolean(
            product &&
              cell.cell_category &&
              product.product_type !== cell.cell_category,
          );
        })
        .map((cell) => cell.position),
    [cells, productsById],
  );
  const hasValidationError =
    duplicateProductIds.size > 0 || categoryMismatchPositions.length > 0;

  const updateCell = (
    position: number,
    patch: Partial<{ productId: string; isActive: boolean }>,
  ) => {
    setCells((current) =>
      current.map((cell) =>
        cell.position === position ? { ...cell, ...patch } : cell,
      ),
    );
    setSaveError("");
  };

  const save = async () => {
    if (hasValidationError) return;

    setIsSaving(true);
    setSaveError("");
    try {
      const response = await fetch(`/api/portal/machines/${machineId}/cells`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          assignments: cells.map((cell) => ({
            position: cell.position,
            productId: cell.productId ? Number(cell.productId) : null,
            isActive: cell.isActive,
          })),
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || "Container assignments could not be saved.");
      }

      const refreshed = (Array.isArray(payload) ? payload : payload?.cells || []) as PortalMachineCell[];
      setCells(
        refreshed.map((cell) => ({
          ...cell,
          productId: cell.product ? String(cell.product.id) : "",
        })),
      );
      toast({
        title: "Container assignments saved",
        description: "The machine should reflect these changes within about 3 minutes.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Container assignments could not be saved.";
      setSaveError(message);
      toast({
        title: "Save failed",
        description: message,
        status: "error",
        duration: 7000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box
      bg="bg.900"
      border="1px solid"
      borderColor="whiteAlpha.100"
      borderRadius="2xl"
      p={{ base: "5", md: "6" }}
      gridColumn={{ xl: "1 / -1" }}
    >
      <VStack spacing="4" align="stretch">
        <Box>
          <Text color="acid.300" fontWeight="800" fontSize="lg">
            Containers / Assortment
          </Text>
          <Text color="bg.300" mt="1">
            Choose which catalog product is installed in each physical container.
          </Text>
        </Box>

        {loadError ? (
          <Alert status="error" borderRadius="xl">
            <AlertIcon />
            {loadError}
          </Alert>
        ) : !cells.length ? (
          <Alert status="info" borderRadius="xl">
            <AlertIcon />
            This machine&apos;s containers aren&apos;t initialized yet — contact ops.
          </Alert>
        ) : (
          <>
            {duplicateProductIds.size ? (
              <Alert status="warning" borderRadius="xl">
                <AlertIcon />
                A product cannot be assigned to two active containers.
              </Alert>
            ) : null}
            {categoryMismatchPositions.length ? (
              <Alert status="warning" borderRadius="xl">
                <AlertIcon />
                Product type does not match container {categoryMismatchPositions.join(", ")}.
              </Alert>
            ) : null}
            {saveError ? (
              <Alert status="error" borderRadius="xl">
                <AlertIcon />
                {saveError}
              </Alert>
            ) : null}

            <TableContainer>
              <Table variant="simple" colorScheme="whiteAlpha" minW="680px">
                <Thead>
                  <Tr>
                    <Th pl="0">Position</Th>
                    <Th>Category</Th>
                    <Th>Product</Th>
                    <Th pr="0">Active</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {cells.map((cell) => {
                    const hasDuplicate = duplicateProductIds.has(cell.productId);
                    const selectedProduct = productsById.get(cell.productId);
                    const hasCategoryMismatch = Boolean(
                      selectedProduct &&
                        cell.cell_category &&
                        selectedProduct.product_type !== cell.cell_category,
                    );
                    return (
                      <Tr key={cell.id}>
                        <Td pl="0" color="bg.50" fontWeight="700">
                          {cell.position}
                        </Td>
                        <Td>
                          <Badge colorScheme={cell.cell_category === "concentrate" ? "purple" : "orange"}>
                            {cell.cell_category || "Unknown"}
                          </Badge>
                        </Td>
                        <Td minW="320px">
                          <FormControl isInvalid={hasDuplicate || hasCategoryMismatch}>
                            <FormLabel srOnly>Product for container {cell.position}</FormLabel>
                            <Select
                              value={cell.productId}
                              onChange={(event) =>
                                updateCell(cell.position, { productId: event.target.value })
                              }
                              bg="bg.800"
                              aria-label={`Product for container ${cell.position}`}
                            >
                              <option value="">— Empty —</option>
                              {catalogProducts.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {productLabel(product)}
                                </option>
                              ))}
                            </Select>
                          </FormControl>
                        </Td>
                        <Td pr="0">
                          <HStack>
                            <Switch
                              isChecked={cell.isActive}
                              onChange={(event) =>
                                updateCell(cell.position, { isActive: event.target.checked })
                              }
                              colorScheme="green"
                              aria-label={`Container ${cell.position} active`}
                            />
                            <Text color="bg.300">
                              {cell.isActive ? "Active" : "Disabled"}
                            </Text>
                          </HStack>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </TableContainer>

            <Button
              onClick={save}
              variant="primary"
              size="lg"
              alignSelf="flex-start"
              isLoading={isSaving}
              isDisabled={hasValidationError}
            >
              Save assortment
            </Button>
          </>
        )}
      </VStack>
    </Box>
  );
}
