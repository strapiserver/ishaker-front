import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  HStack,
  NumberInput,
  NumberInputField,
  Select,
  SimpleGrid,
  Switch,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { getDuplicateContainerSlots, isValidContainerSlot } from "../../../lib/portal/containerSlots";
import { formatMoney } from "../../../lib/portal/currency";
import {
  canAssignProduct,
  getProductAssignmentProblems,
} from "../../../lib/portal/productAssignment";
import type { PortalCatalogProduct, PortalMachineCell } from "../../../types/portal";
import type { Currency } from "../../../types/strapi";

type MachineCellsSectionProps = {
  machineId: string | number;
  machineSerial: string | null;
  initialCells: PortalMachineCell[];
  catalogProducts: PortalCatalogProduct[];
  loadError?: string | null;
  currency?: Currency | null;
  containerCount: number | null;
};

type CellDraft = Omit<PortalMachineCell, "id"> & {
  id: number | null;
  productId: string;
  priceValue: string;
  cellCategory: "powder" | "concentrate";
};

type PlanogramItem = {
  cell_id?: string | number | null;
  position?: number | null;
  product?: string | number | null;
  code?: string;
  detail?: string;
};

type PlanogramFeedback = {
  source: string | null;
  problems: PlanogramItem[];
  skipped: PlanogramItem[];
  validationError: string | null;
};

const hydrateCell = (cell: PortalMachineCell): CellDraft => ({
  ...cell,
  id: Number(cell.id),
  productId: cell.product ? String(cell.product.id) : "",
  priceValue:
    cell.price === null || cell.price === undefined ? "" : String(cell.price),
  cellCategory: cell.cell_category || "powder",
});

const emptySlot = (position: number): CellDraft => ({
  id: null,
  position,
  isActive: true,
  cell_category: "powder",
  cellCategory: "powder",
  product: null,
  productId: "",
  priceValue: "",
});

const buildDrafts = (
  initialCells: PortalMachineCell[],
  containerCount: number | null,
) => {
  const existing = initialCells.map(hydrateCell);
  if (!containerCount) return existing;
  const occupied = new Set(
    existing
      .map((cell) => cell.position)
      .filter((position) => isValidContainerSlot(position, containerCount)),
  );
  return [
    ...existing,
    ...Array.from({ length: containerCount }, (_, index) => index + 1)
      .filter((position) => !occupied.has(position))
      .map(emptySlot),
  ];
};

const productLabel = (product: PortalCatalogProduct) => {
  const line = product.product_line?.name?.trim();
  const taste = product.taste?.name?.trim() || product.name;
  return line ? `${line} — ${taste}` : `Orphan — ${taste}`;
};

export function MachineCellsSection({
  machineId,
  machineSerial,
  initialCells,
  catalogProducts,
  loadError,
  currency,
  containerCount,
}: MachineCellsSectionProps) {
  const toast = useToast();
  const [cells, setCells] = useState(() =>
    buildDrafts(initialCells, containerCount),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [planogram, setPlanogram] = useState<PlanogramFeedback | null>(null);
  const productsById = useMemo(
    () => new Map(catalogProducts.map((product) => [String(product.id), product])),
    [catalogProducts],
  );
  const duplicatePositions = useMemo(
    () =>
      getDuplicateContainerSlots(
        cells.filter((cell) => cell.id !== null || cell.productId).map((cell) => cell.position),
      ),
    [cells],
  );
  const invalidLegacyCells = cells.filter(
    (cell) =>
      cell.id !== null &&
      (!isValidContainerSlot(cell.position, containerCount) ||
        duplicatePositions.has(cell.position)),
  );
  const selectedProductProblems = cells.flatMap((cell) => {
    if (!cell.productId) return [];
    const product = productsById.get(cell.productId);
    if (!product) return [`Container ${cell.position}: product is not in this library.`];
    const problems = getProductAssignmentProblems(product);
    if (product.product_type && product.product_type !== cell.cellCategory) {
      problems.push({
        code: "no_product_type",
        detail: `This is a ${product.product_type} product, not ${cell.cellCategory}.`,
      });
    }
    return problems.map(
      (problem) => `Container ${cell.position}: ${problem.detail}`,
    );
  });
  const invalidPricePositions = cells
    .filter(
      (cell) =>
        cell.priceValue !== "" &&
        (!Number.isFinite(Number(cell.priceValue)) ||
          Number(cell.priceValue) <= 0),
    )
    .map((cell) => cell.position);
  const hasValidationError =
    containerCount === null ||
    invalidLegacyCells.length > 0 ||
    duplicatePositions.size > 0 ||
    selectedProductProblems.length > 0 ||
    invalidPricePositions.length > 0;

  const updateCell = (
    target: CellDraft,
    patch: Partial<
      Pick<CellDraft, "position" | "productId" | "isActive" | "priceValue" | "cellCategory">
    >,
  ) => {
    setCells((current) => {
      const nextPosition = patch.position;
      const withoutEmptyDestination =
        nextPosition === undefined
          ? current
          : current.filter(
              (cell) =>
                !(
                  cell !== target &&
                  cell.id === null &&
                  !cell.productId &&
                  cell.position === nextPosition
                ),
            );
      return withoutEmptyDestination.map((cell) =>
        cell === target ? { ...cell, ...patch } : cell,
      );
    });
    setSaveError("");
    setPlanogram(null);
  };

  const validatePlanogram = async () => {
    if (!machineSerial) return;
    try {
      const response = await fetch(
        `/api/portal/machines/${machineId}/planogram`,
      );
      const payload = await response.json().catch(() => ({}));
      const body = payload?.data || payload;
      const validationError =
        response.ok || response.status === 422
          ? null
          : payload?.message ||
            payload?.error?.message ||
            "The planogram validator is unavailable.";
      const feedback: PlanogramFeedback = {
        source: response.headers.get("x-planogram-source"),
        problems: Array.isArray(body?.problems) ? body.problems : [],
        skipped: Array.isArray(body?.skipped) ? body.skipped : [],
        validationError,
      };
      setPlanogram(feedback);
      if (validationError) {
        toast({
          title: "Assignments saved; validation unavailable",
          description: validationError,
          status: "warning",
          duration: 7000,
          isClosable: true,
        });
      }
    } catch {
      const validationError = "The planogram validator could not be reached.";
      setPlanogram({
        source: null,
        problems: [],
        skipped: [],
        validationError,
      });
      toast({
        title: "Assignments saved; validation unavailable",
        description: validationError,
        status: "warning",
        duration: 7000,
        isClosable: true,
      });
    }
  };

  const save = async () => {
    if (hasValidationError) return;
    setIsSaving(true);
    setSaveError("");
    setPlanogram(null);
    try {
      const response = await fetch(`/api/portal/machines/${machineId}/cells`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          assignments: cells.map((cell) => ({
            cellId: cell.id,
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
      setCells(buildDrafts(refreshed, containerCount));
      toast({
        title: "Container assignments saved",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      await validatePlanogram();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Container assignments could not be saved.";
      setSaveError(message);
      toast({ title: "Save failed", description: message, status: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const renderSlot = (cell: CellDraft, isLegacy = false) => {
    const selectedProduct = productsById.get(cell.productId);
    const productProblems = selectedProduct
      ? getProductAssignmentProblems(selectedProduct)
      : [];
    const categoryMismatch = Boolean(
      selectedProduct?.product_type &&
        selectedProduct.product_type !== cell.cellCategory,
    );
    return (
      <Box
        key={`${cell.id ?? "empty"}-${cell.position}`}
        bg="bg.800"
        border="1px solid"
        borderColor={isLegacy ? "red.500" : "whiteAlpha.200"}
        borderRadius="xl"
        p="4"
      >
        <HStack justify="space-between" mb="4">
          <Text fontWeight="800" fontSize="lg">
            {isLegacy ? "Invalid container" : `Container ${cell.position}`}
          </Text>
          <HStack>
            <Switch
              isChecked={cell.isActive}
              onChange={(event) =>
                updateCell(cell, { isActive: event.target.checked })
              }
              isDisabled={!cell.productId}
              colorScheme="green"
            />
            <Text color="bg.300" fontSize="sm">
              {cell.isActive ? "On" : "Off"}
            </Text>
          </HStack>
        </HStack>
        <VStack align="stretch" spacing="3">
          {isLegacy ? (
            <FormControl isInvalid>
              <Select
                value={isValidContainerSlot(cell.position, containerCount) ? cell.position : ""}
                placeholder={`Invalid saved position (${cell.position})`}
                bg="bg.900"
                onChange={(event) =>
                  updateCell(cell, { position: Number(event.target.value) })
                }
              >
                {Array.from({ length: containerCount || 0 }, (_, index) => index + 1)
                  .filter(
                    (position) =>
                      !cells.some(
                        (other) =>
                          other !== cell &&
                          (other.id !== null || other.productId) &&
                          other.position === position,
                      ),
                  )
                  .map((position) => (
                    <option key={position} value={position}>
                      Container {position}
                    </option>
                  ))}
              </Select>
              <FormErrorMessage>
                Choose one unoccupied physical container.
              </FormErrorMessage>
            </FormControl>
          ) : null}
          <Select
            value={cell.cellCategory}
            bg="bg.900"
            aria-label={`Category for container ${cell.position}`}
            onChange={(event) =>
              updateCell(cell, {
                cellCategory: event.target.value as "powder" | "concentrate",
              })
            }
          >
            <option value="powder">Powder</option>
            <option value="concentrate">Concentrate</option>
          </Select>
          <FormControl isInvalid={productProblems.length > 0 || categoryMismatch}>
            <Select
              value={cell.productId}
              bg="bg.900"
              aria-label={`Product for container ${cell.position}`}
              onChange={(event) =>
                updateCell(cell, { productId: event.target.value })
              }
            >
              <option value="">— Empty —</option>
              {catalogProducts.map((product) => {
                const unavailable = !canAssignProduct(product);
                return (
                  <option
                    key={product.id}
                    value={product.id}
                    disabled={unavailable && String(product.id) !== cell.productId}
                  >
                    {productLabel(product)}
                    {unavailable ? " — unavailable" : ""}
                  </option>
                );
              })}
            </Select>
            <FormErrorMessage>
              {categoryMismatch
                ? `Choose a ${cell.cellCategory} product.`
                : productProblems[0]?.detail}
            </FormErrorMessage>
          </FormControl>
          <NumberInput min={0.01} precision={2} value={cell.priceValue}>
            <NumberInputField
              placeholder="Optional price override"
              aria-label={`Price override for container ${cell.position}`}
              onChange={(event) =>
                updateCell(cell, { priceValue: event.target.value })
              }
            />
          </NumberInput>
          <HStack justify="space-between">
            <Text color="bg.300" fontSize="sm">
              Effective price
            </Text>
            <Text fontWeight="700">
              {formatMoney(
                cell.priceValue || selectedProduct?.dosage?.full_drink_price,
                currency,
              )}
            </Text>
          </HStack>
        </VStack>
      </Box>
    );
  };

  const slots = Array.from({ length: containerCount || 0 }, (_, index) => index + 1);
  const primaryCells = slots.map((position) => {
    const matches = cells.filter(
      (cell) =>
        cell.position === position &&
        !invalidLegacyCells.includes(cell),
    );
    return matches[0] || emptySlot(position);
  });

  return (
    <Box bg="bg.900" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl" p={{ base: "5", md: "6" }} gridColumn={{ xl: "1 / -1" }}>
      <VStack spacing="4" align="stretch">
        <Box>
          <Text color="acid.300" fontWeight="800" fontSize="lg">
            Container assignment
          </Text>
          <Text color="bg.300" mt="1">
            Each card is one physical machine container. The product library is not a machine binding.
          </Text>
        </Box>
        {loadError ? <Alert status="error"><AlertIcon />{loadError}</Alert> : null}
        {containerCount === null ? (
          <Alert status="error"><AlertIcon />This machine type has no container count.</Alert>
        ) : null}
        {invalidLegacyCells.length ? (
          <Alert status="error"><AlertIcon />Repair the saved invalid or duplicate positions below. Positions are never shifted automatically.</Alert>
        ) : null}
        {selectedProductProblems.length ? (
          <Alert status="error">
            <AlertIcon />
            <VStack align="start" spacing="0">
              {selectedProductProblems.map((problem, index) => (
                <Text key={`${problem}-${index}`}>{problem}</Text>
              ))}
            </VStack>
          </Alert>
        ) : null}
        {invalidPricePositions.length ? (
          <Alert status="error">
            <AlertIcon />
            Price overrides must be greater than zero in container{" "}
            {invalidPricePositions.join(", ")}.
          </Alert>
        ) : null}
        {saveError ? <Alert status="error"><AlertIcon />{saveError}</Alert> : null}
        {planogram?.source ? (
          <Text color="bg.300">
            Planogram source: <Badge>{planogram.source}</Badge>
          </Text>
        ) : null}
        {planogram?.validationError ? (
          <Alert status="warning">
            <AlertIcon />
            Assignments are saved, but validation could not run:{" "}
            {planogram.validationError}
          </Alert>
        ) : null}
        {planogram?.problems.length ? (
          <Alert status="error">
            <AlertIcon />
            <VStack align="start" spacing="1">
              {planogram.problems.map((problem, index) => (
                <Text key={`${problem.cell_id}-${problem.code}-${index}`}>
                  Container {problem.position ?? "?"}: {problem.detail || problem.code}
                </Text>
              ))}
            </VStack>
          </Alert>
        ) : null}
        {planogram?.skipped.length ? (
          <Alert status="info">
            <AlertIcon />
            <VStack align="start" spacing="1">
              {planogram.skipped.map((item, index) => (
                <Text key={`${item.cell_id}-${item.code}-${index}`}>
                  Container {item.position ?? "?"}: {item.detail || item.code}
                </Text>
              ))}
            </VStack>
          </Alert>
        ) : null}
        <SimpleGrid columns={{ base: 1, xl: 2 }} spacing="4">
          {primaryCells.map((cell) => renderSlot(cell))}
        </SimpleGrid>
        {invalidLegacyCells.length ? (
          <Box>
            <Text fontWeight="800" color="red.200" mb="3">Saved rows requiring repair</Text>
            <SimpleGrid columns={{ base: 1, xl: 2 }} spacing="4">
              {invalidLegacyCells.map((cell) => renderSlot(cell, true))}
            </SimpleGrid>
          </Box>
        ) : null}
        <Button
          onClick={() => void save()}
          variant="primary"
          size="lg"
          alignSelf="start"
          isLoading={isSaving}
          isDisabled={hasValidationError}
        >
          Save container assignment
        </Button>
      </VStack>
    </Box>
  );
}
