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
  NumberInput,
  NumberInputField,
  IconButton,
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
import { FaPlus, FaTrash } from "react-icons/fa";
import { formatMoney } from "../../../lib/portal/currency";
import type {
  PortalCatalogProduct,
  PortalMachineCell,
} from "../../../types/portal";
import type { Currency } from "../../../types/strapi";

type MachineCellsSectionProps = {
  machineId: string | number;
  initialCells: PortalMachineCell[];
  catalogProducts: PortalCatalogProduct[];
  loadError?: string | null;
  currency?: Currency | null;
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
  currency,
}: MachineCellsSectionProps) {
  const toast = useToast();
  const [cells, setCells] = useState(
    [...initialCells]
      .sort((left, right) => left.position - right.position)
      .map((cell) => ({
        ...cell,
        productId: cell.product ? String(cell.product.id) : "",
        priceValue:
          cell.price === null || cell.price === undefined ? "" : String(cell.price),
        cellCategory: cell.cell_category || "powder",
      })),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
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
              cell.cellCategory &&
              product.product_type !== cell.cellCategory,
          );
        })
        .map((cell) => cell.position),
    [cells, productsById],
  );
  const duplicatePositions = useMemo(() => {
    const counts = new Map<number, number>();
    cells.forEach((cell) =>
      counts.set(cell.position, (counts.get(cell.position) || 0) + 1),
    );
    return new Set(
      [...counts.entries()]
        .filter(([, count]) => count > 1)
        .map(([position]) => position),
    );
  }, [cells]);
  const hasValidationError =
    duplicateProductIds.size > 0 ||
    duplicatePositions.size > 0 ||
    categoryMismatchPositions.length > 0 ||
    cells.some(
      (cell) => !Number.isInteger(cell.position) || cell.position < 0,
    );

  const updateCell = (
    cellId: string | number,
    patch: Partial<{
      position: number;
      productId: string;
      isActive: boolean;
      priceValue: string;
      cellCategory: "powder" | "concentrate";
    }>,
  ) => {
    setCells((current) =>
      current.map((cell) =>
        cell.id === cellId ? { ...cell, ...patch } : cell,
      ),
    );
    setSaveError("");
  };

  const hydrateCells = (nextCells: PortalMachineCell[]) =>
    nextCells.map((cell) => ({
      ...cell,
      productId: cell.product ? String(cell.product.id) : "",
      priceValue:
        cell.price === null || cell.price === undefined ? "" : String(cell.price),
      cellCategory: cell.cell_category || "powder",
    }));

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
            cellId: Number(cell.id),
            position: cell.position,
            productId: cell.productId ? Number(cell.productId) : null,
            isActive: cell.isActive,
            price: cell.priceValue === "" ? null : Number(cell.priceValue),
            cellCategory: cell.cellCategory,
          })),
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || "Container assignments could not be saved.");
      }

      const refreshed = (Array.isArray(payload) ? payload : payload?.cells || []) as PortalMachineCell[];
      setCells(hydrateCells(refreshed));
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

  const addCell = async () => {
    const position = cells.length
      ? Math.max(...cells.map((cell) => cell.position)) + 1
      : 0;
    setIsAdding(true);
    setSaveError("");
    try {
      const response = await fetch(`/api/portal/machines/${machineId}/cells`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          position,
          productId: null,
          isActive: true,
          price: null,
          cellCategory: "powder",
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || "Container could not be created.");
      }
      setCells(hydrateCells(Array.isArray(payload) ? payload : []));
      toast({ title: "Container added", status: "success" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Container could not be created.";
      setSaveError(message);
      toast({ title: "Add failed", description: message, status: "error" });
    } finally {
      setIsAdding(false);
    }
  };

  const removeCell = async (cellId: string | number, position: number) => {
    if (!window.confirm(`Delete container position ${position}?`)) return;
    setDeletingId(cellId);
    setSaveError("");
    try {
      const response = await fetch(`/api/portal/machines/${machineId}/cells`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cellId }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || "Container could not be deleted.");
      }
      setCells((current) => current.filter((cell) => cell.id !== cellId));
      toast({ title: "Container deleted", status: "success" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Container could not be deleted.";
      setSaveError(message);
      toast({ title: "Delete failed", description: message, status: "error" });
    } finally {
      setDeletingId(null);
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
        ) : (
          <>
            {!cells.length ? (
              <Alert status="info" borderRadius="xl">
                <AlertIcon />
                No containers exist yet. Add the first position below.
              </Alert>
            ) : null}
            {duplicateProductIds.size ? (
              <Alert status="warning" borderRadius="xl">
                <AlertIcon />
                A product cannot be assigned to two active containers.
              </Alert>
            ) : null}
            {duplicatePositions.size ? (
              <Alert status="warning" borderRadius="xl">
                <AlertIcon />
                Container positions must be unique.
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
              <Table variant="simple" colorScheme="whiteAlpha" minW="980px">
                <Thead>
                  <Tr>
                    <Th pl="0">Position</Th>
                    <Th>Category</Th>
                    <Th>Product</Th>
                    <Th>Price override</Th>
                    <Th>Effective price</Th>
                    <Th pr="0">Active</Th>
                    <Th />
                  </Tr>
                </Thead>
                <Tbody>
                  {cells.map((cell) => {
                    const hasDuplicate = duplicateProductIds.has(cell.productId);
                    const selectedProduct = productsById.get(cell.productId);
                    const hasCategoryMismatch = Boolean(
                      selectedProduct &&
                        cell.cellCategory &&
                        selectedProduct.product_type !== cell.cellCategory,
                    );
                    return (
                      <Tr key={cell.id}>
                        <Td pl="0" minW="120px">
                          <NumberInput
                            min={0}
                            precision={0}
                            value={cell.position}
                            isInvalid={
                              duplicatePositions.has(cell.position) ||
                              !Number.isInteger(cell.position) ||
                              cell.position < 0
                            }
                            onChange={(_, value) =>
                              updateCell(cell.id, { position: value })
                            }
                          >
                            <NumberInputField
                              aria-label={`Position for container ${cell.position}`}
                            />
                          </NumberInput>
                        </Td>
                        <Td>
                          <Select
                            value={cell.cellCategory}
                            onChange={(event) =>
                              updateCell(cell.id, {
                                cellCategory: event.target.value as "powder" | "concentrate",
                              })
                            }
                            aria-label={`Category for container ${cell.position}`}
                            bg="bg.800"
                          >
                            <option value="powder">Powder</option>
                            <option value="concentrate">Concentrate</option>
                          </Select>
                        </Td>
                        <Td minW="320px">
                          <FormControl isInvalid={hasDuplicate || hasCategoryMismatch}>
                            <FormLabel srOnly>Product for container {cell.position}</FormLabel>
                            <Select
                              value={cell.productId}
                              onChange={(event) =>
                                updateCell(cell.id, { productId: event.target.value })
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
                        <Td minW="180px">
                          <NumberInput
                            min={0}
                            precision={2}
                            value={cell.priceValue}
                          >
                            <NumberInputField
                              aria-label={`Price override for container ${cell.position}`}
                              placeholder="Inherit"
                              onChange={(event) =>
                                updateCell(cell.id, {
                                  priceValue: event.target.value,
                                })
                              }
                            />
                          </NumberInput>
                        </Td>
                        <Td minW="170px">
                          {(() => {
                            const inherited =
                              selectedProduct?.dosage?.full_drink_price;
                            const isOverride = cell.priceValue !== "";
                            const effective = isOverride
                              ? cell.priceValue
                              : inherited;
                            return (
                              <VStack align="start" spacing="1">
                                <Text color="bg.50" fontWeight="700">
                                  {formatMoney(effective, currency)}
                                </Text>
                                <Badge colorScheme={isOverride ? "purple" : "gray"}>
                                  {isOverride ? "Override" : "Inherited"}
                                </Badge>
                              </VStack>
                            );
                          })()}
                        </Td>
                        <Td pr="0">
                          <HStack>
                            <Switch
                              isChecked={cell.isActive}
                              onChange={(event) =>
                                updateCell(cell.id, { isActive: event.target.checked })
                              }
                              colorScheme="green"
                              aria-label={`Container ${cell.position} active`}
                            />
                            <Text color="bg.300">
                              {cell.isActive ? "Active" : "Disabled"}
                            </Text>
                          </HStack>
                        </Td>
                        <Td pr="0">
                          <IconButton
                            aria-label={`Delete container ${cell.position}`}
                            icon={<FaTrash />}
                            colorScheme="red"
                            variant="ghost"
                            isLoading={deletingId === cell.id}
                            onClick={() => removeCell(cell.id, cell.position)}
                          />
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </TableContainer>

            <HStack>
              <Button
                onClick={save}
                variant="primary"
                size="lg"
                isLoading={isSaving}
                isDisabled={hasValidationError || !cells.length}
              >
                Save assortment
              </Button>
              <Button
                onClick={addCell}
                variant="contrast"
                leftIcon={<FaPlus />}
                isLoading={isAdding}
              >
                Add container
              </Button>
            </HStack>
          </>
        )}
      </VStack>
    </Box>
  );
}
