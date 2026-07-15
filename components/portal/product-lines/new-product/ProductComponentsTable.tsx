import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  NumberInput,
  NumberInputField,
  Select,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FaPlus, FaTrash } from "react-icons/fa";
import type { PortalComponent } from "../../../../types/portal";
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

  return (
    <Box>
      <SimpleGrid
        columns={{ base: 1, md: 3 }}
        spacing="4"
        alignItems="flex-start"
        mb="5"
      >
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

        <FormControl isRequired>
          <FormLabel>Serving quantity</FormLabel>
          <NumberInput min={0.01} precision={2} value={servingQuantity}>
            <NumberInputField
              onChange={(event) => onServingQuantityChange(event.target.value)}
              bg="bg.800"
            />
          </NumberInput>
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
        </FormControl>
      </SimpleGrid>

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
            <HStack key={row.id} spacing="3" align="flex-start">
              <Box flex="1" minW="0">
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
              <Box w={{ base: "96px", md: "126px" }}>
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
                w={{ base: "76px", md: "92px" }}
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
                mt="1"
                onClick={() =>
                  onChange(rows.filter((item) => item.id !== row.id))
                }
              />
            </HStack>
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
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing="4">
          <FormControl isRequired>
            <FormLabel>Drink volume</FormLabel>
            <NumberInput min={0.01} precision={2} value={dosage.drinkVolume}>
              <NumberInputField
                onChange={(event) =>
                  onDosageChange({ ...dosage, drinkVolume: event.target.value })
                }
                bg="bg.800"
              />
            </NumberInput>
          </FormControl>

          <FormControl isRequired maxW="120px">
            <FormLabel>Volume unit</FormLabel>
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

          <FormControl isRequired>
            <FormLabel>Water</FormLabel>
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
            <FormLabel>Product</FormLabel>
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
            <FormLabel>Conversion factor</FormLabel>
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
