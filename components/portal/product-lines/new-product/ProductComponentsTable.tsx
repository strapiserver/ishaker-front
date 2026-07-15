import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Grid,
  HStack,
  IconButton,
  NumberInput,
  NumberInputField,
  Select,
  SimpleGrid,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { type DragEvent, useState } from "react";
import { FaGripVertical, FaPlus, FaTrash } from "react-icons/fa";
import type { PortalComponent } from "../../../../types/portal";
import { Help } from "../../../Help";
import { ComponentNameSelect } from "./ComponentNameSelect";

export type ProductComponentRow = {
  componentId: string;
  id: string;
  isCustom: boolean;
  name: string;
  quantity: string;
  unit: string;
};

export type ProductDosageValue = {
  conversionFactor: string;
  drinkVolume: string;
  drinkVolumeUnit: "ml" | "oz";
  product: string;
  water: string;
};

type ProductComponentsTableProps = {
  category: "powder" | "concentrate";
  components: PortalComponent[];
  dosage: ProductDosageValue;
  onCategoryChange: (value: "powder" | "concentrate") => void;
  onChange: (rows: ProductComponentRow[]) => void;
  onDosageChange: (value: ProductDosageValue) => void;
  onServingQuantityChange: (value: string) => void;
  onServingUnitChange: (value: "g" | "ml") => void;
  rows: ProductComponentRow[];
  servingQuantity: string;
  servingUnit: "g" | "ml";
};

const MAX_COMPONENTS = 50;
const componentUnits = ["mg", "g", "mcg", "kJ", "kcal"];

export function ProductComponentsTable({
  category,
  components,
  dosage,
  onChange,
  onCategoryChange,
  onDosageChange,
  onServingQuantityChange,
  onServingUnitChange,
  rows,
  servingQuantity,
  servingUnit,
}: ProductComponentsTableProps) {
  const [draggedRowId, setDraggedRowId] = useState("");

  const addRow = () => {
    if (rows.length >= MAX_COMPONENTS) return;
    onChange([
      ...rows,
      {
        id: `component-${Date.now()}-${rows.length}`,
        componentId: "",
        isCustom: false,
        name: "",
        quantity: "",
        unit: "g",
      },
    ]);
  };
  const updateRow = (rowId: string, updates: Partial<ProductComponentRow>) =>
    onChange(
      rows.map((row) => (row.id === rowId ? { ...row, ...updates } : row)),
    );
  const moveRow = (rowId: string, targetIndex: number) => {
    const currentIndex = rows.findIndex((row) => row.id === rowId);
    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= rows.length ||
      currentIndex === targetIndex
    ) {
      return;
    }
    const reorderedRows = [...rows];
    const [movedRow] = reorderedRows.splice(currentIndex, 1);
    reorderedRows.splice(targetIndex, 0, movedRow);
    onChange(reorderedRows);
  };
  const handleDragOver = (
    event: DragEvent<HTMLDivElement>,
    targetIndex: number,
  ) => {
    event.preventDefault();
    if (draggedRowId) moveRow(draggedRowId, targetIndex);
  };

  return (
    <Box>
      <VStack spacing="4" mb="5">
        <FormControl isRequired>
          <FormLabel>Category</FormLabel>
          <Select
            value={category}
            onChange={(event) =>
              onCategoryChange(event.target.value as "powder" | "concentrate")
            }
            bg="bg.800"
          >
            <option value="powder">Powder</option>
            <option value="concentrate">Concentrate</option>
          </Select>
        </FormControl>

        <HStack w="full">
          <FormControl isRequired>
            <HStack>
              <Text as="span">Serving quantity</Text>
              <Help text="It's important to specify the serving quantity to recalculate components per cup. Might be per 100g or per custom serving" />
            </HStack>

            <NumberInput min={0.01} precision={2} value={servingQuantity}>
              <NumberInputField
                onChange={(event) =>
                  onServingQuantityChange(event.target.value)
                }
                bg="bg.800"
              />
            </NumberInput>
            <FormHelperText>Written on package</FormHelperText>
            {/* <FormHelperText>{`Amount of ${category}`}</FormHelperText> */}
          </FormControl>

          <FormControl isRequired maxW="120px">
            <FormLabel>Unit</FormLabel>
            <Select
              value={servingUnit}
              onChange={(event) =>
                onServingUnitChange(event.target.value as "g" | "ml")
              }
              bg="bg.800"
            >
              <option value="g">g</option>
              <option value="ml">ml</option>
            </Select>
            <FormHelperText>grams, milliliters</FormHelperText>
          </FormControl>
        </HStack>
      </VStack>

      <HStack justify="space-between" mb="3">
        <Box>
          <FormLabel mb="0">Components</FormLabel>
          <Text color="bg.300" fontSize="sm">
            Up to {MAX_COMPONENTS} components per product.
          </Text>
        </Box>
        <Text color="bg.300" fontSize="sm">
          {rows.length} / {MAX_COMPONENTS}
        </Text>
      </HStack>

      <VStack
        spacing="3"
        align="stretch"
        bgColor="bg.1000"
        p="2"
        borderRadius="md"
      >
        {rows.map((row, index) => {
          return (
            <Grid
              key={row.id}
              templateColumns={{
                base: "40px minmax(0, 1fr) 80px",
                md: "40px minmax(0, 1fr) 96px 92px 40px",
              }}
              templateRows={{ base: "40px 40px", md: "40px" }}
              columnGap="3"
              rowGap="2"
              alignItems="center"
              bg="whiteAlpha.50"
              border="1px solid"
              borderColor="whiteAlpha.100"
              borderRadius="lg"
              p="2"
              onDragOver={(event) => handleDragOver(event, index)}
            >
              <IconButton
                aria-label={`Drag component ${index + 1} to reorder`}
                title="Drag to reorder"
                icon={<FaGripVertical />}
                cursor="grab"
                gridColumn="1"
                gridRow="1"
                draggable
                onDragStart={(event) => {
                  setDraggedRowId(row.id);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", row.id);
                }}
                onDragEnd={() => setDraggedRowId("")}
                onKeyDown={(event) => {
                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    moveRow(row.id, index - 1);
                  }
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    moveRow(row.id, index + 1);
                  }
                }}
              />
              <Box minW="0" gridColumn="2" gridRow="1">
                <ComponentNameSelect
                  components={components}
                  value={row.name}
                  onNameChange={(name) =>
                    updateRow(row.id, {
                      componentId: "",
                      isCustom: false,
                      name,
                    })
                  }
                  onCreateCustom={() =>
                    updateRow(row.id, { componentId: "", isCustom: true })
                  }
                  onSelect={(component) =>
                    updateRow(row.id, {
                      componentId: String(component.id),
                      isCustom: false,
                      name: component.name,
                      quantity:
                        component.default_value !== undefined &&
                        component.default_value !== null
                          ? String(component.default_value)
                          : row.quantity,
                      unit: component.unit || row.unit,
                    })
                  }
                />
              </Box>
              <Box
                minW="0"
                gridColumn={{ base: "1 / 3", md: "3" }}
                gridRow={{ base: "2", md: "1" }}
              >
                <NumberInput min={0.001} precision={3} value={row.quantity}>
                  <NumberInputField
                    aria-label={`Quantity for component ${index + 1}`}
                    onChange={(event) =>
                      updateRow(row.id, { quantity: event.target.value })
                    }
                    h="40px"
                    borderColor="whiteAlpha.200"
                  />
                </NumberInput>
              </Box>
              <Select
                aria-label={`Unit for component ${index + 1}`}
                value={row.unit}
                onChange={(event) =>
                  updateRow(row.id, { unit: event.target.value })
                }
                gridColumn={{ base: "3", md: "4" }}
                gridRow={{ base: "2", md: "1" }}
                w="full"
                h="40px"
                borderColor="whiteAlpha.200"
              >
                {componentUnits.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </Select>
              <IconButton
                aria-label={`Remove component ${index + 1}`}
                icon={<FaTrash />}
                variant="ghost"
                gridColumn={{ base: "3", md: "5" }}
                gridRow="1"
                onClick={() =>
                  onChange(rows.filter((item) => item.id !== row.id))
                }
              />
            </Grid>
          );
        })}
      </VStack>

      <Button
        mt="4"
        leftIcon={<FaPlus />}
        variant="outline"
        onClick={addRow}
        isDisabled={rows.length >= MAX_COMPONENTS}
      >
        Add component
      </Button>

      <Box mt="7">
        <FormLabel mb="1">Dosage</FormLabel>
        <Text color="bg.300" fontSize="sm" mb="3">
          Machine recipe for one drink.
        </Text>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing="4">
          <Stack
            direction={{ base: "column", md: "row" }}
            spacing={{ base: "4", md: "2" }}
            align="stretch"
          >
            <FormControl isRequired>
              <HStack>
                <Text as="span">Drink volume</Text>
                <Help text="The total volume of the prepared drink dispensed into one cup." />
              </HStack>
              <NumberInput min={0.01} precision={2} value={dosage.drinkVolume}>
                <NumberInputField
                  onChange={(event) =>
                    onDosageChange({
                      ...dosage,
                      drinkVolume: event.target.value,
                    })
                  }
                  bg="bg.800"
                />
              </NumberInput>
            </FormControl>

            <FormControl isRequired maxW={{ base: "full", md: "120px" }}>
              <HStack>
                <Text as="span">Unit</Text>
                <Help text="The unit used for the full drink volume: milliliters or ounces." />
              </HStack>
              <Select
                value={dosage.drinkVolumeUnit}
                onChange={(event) =>
                  onDosageChange({
                    ...dosage,
                    drinkVolumeUnit: event.target.value as "ml" | "oz",
                  })
                }
                bg="bg.800"
              >
                <option value="ml">ml</option>
                <option value="oz">oz</option>
              </Select>
            </FormControl>
          </Stack>
          <FormControl isRequired>
            <HStack>
              <Text as="span">Water</Text>
              <Help text="The amount of water dispensed by the machine for one drink." />
            </HStack>
            <NumberInput min={0.01} precision={2} value={dosage.water}>
              <NumberInputField
                onChange={(event) =>
                  onDosageChange({ ...dosage, water: event.target.value })
                }
                bg="bg.800"
              />
            </NumberInput>
          </FormControl>

          <FormControl isRequired>
            <HStack>
              <Text as="span">Product</Text>
              <Help text="The amount of powder or concentrate dispensed for one drink." />
            </HStack>
            <NumberInput min={0.01} precision={2} value={dosage.product}>
              <NumberInputField
                onChange={(event) =>
                  onDosageChange({ ...dosage, product: event.target.value })
                }
                bg="bg.800"
              />
            </NumberInput>
          </FormControl>

          <FormControl isRequired>
            <HStack>
              <Text as="span">Conversion factor</Text>
              <Help text="The machine conversion factor used to calculate product dispensing." />
            </HStack>
            <NumberInput
              min={0.01}
              precision={2}
              value={dosage.conversionFactor}
            >
              <NumberInputField
                onChange={(event) =>
                  onDosageChange({
                    ...dosage,
                    conversionFactor: event.target.value,
                  })
                }
                bg="bg.800"
              />
            </NumberInput>
          </FormControl>
        </SimpleGrid>
      </Box>
    </Box>
  );
}
