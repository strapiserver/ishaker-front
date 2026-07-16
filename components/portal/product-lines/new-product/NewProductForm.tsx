import {
  Alert,
  AlertIcon,
  Box,
  Divider,
  FormControl,
  FormLabel,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import type { FormEventHandler } from "react";
import type {
  PortalComponent,
  PortalProductPurpose,
  PortalProductType,
} from "../../../../types/portal";
import {
  ProductComponentsTable,
  type ProductComponentRow,
  type ProductDosageValue,
} from "./ProductComponentsTable";
import { ProductNameSelect, type ProductNameOption } from "./ProductNameSelect";
import {
  SearchableImageSelect,
  type SearchableImageOption,
} from "../SearchableImageSelect";

type NewProductFormProps = {
  componentRows: ProductComponentRow[];
  components: PortalComponent[];
  description: string;
  dosage: ProductDosageValue;
  error: string;
  formId: string;
  mainImageId: string;
  mainImageOptions: SearchableImageOption[];
  name: string;
  onComponentRowsChange: (rows: ProductComponentRow[]) => void;
  onCreateCustomProduct: () => void;
  onDescriptionChange: (value: string) => void;
  onDosageChange: (value: ProductDosageValue) => void;
  onNameChange: (value: string) => void;
  onProductSelect: (product: ProductNameOption) => void;
  onProductPurposeChange: (value: PortalProductPurpose) => void;
  onProductTypeChange: (value: PortalProductType) => void;
  onServingQuantityChange: (value: string) => void;
  onServingUnitChange: (value: "g" | "ml") => void;
  onShowMoreMainImages: () => void;
  onShowMoreSplashes: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onVisualChange: {
    circle: (value: string) => void;
    mainImage: (value: string) => void;
    splash: (value: string) => void;
  };
  productLineName: string;
  productOptions: ProductNameOption[];
  productPurpose: PortalProductPurpose;
  productType: PortalProductType;
  servingQuantity: string;
  servingUnit: "g" | "ml";
  splashId: string;
  splashOptions: SearchableImageOption[];
  circleId: string;
  circleOptions: SearchableImageOption[];
};

export function NewProductForm({
  componentRows,
  components,
  description,
  dosage,
  error,
  formId,
  mainImageId,
  mainImageOptions,
  name,
  onComponentRowsChange,
  onCreateCustomProduct,
  onDescriptionChange,
  onDosageChange,
  onNameChange,
  onProductSelect,
  onProductPurposeChange,
  onProductTypeChange,
  onServingQuantityChange,
  onServingUnitChange,
  onShowMoreMainImages,
  onShowMoreSplashes,
  onSubmit,
  onVisualChange,
  productLineName,
  productOptions,
  productPurpose,
  productType,
  servingQuantity,
  servingUnit,
  splashId,
  splashOptions,
  circleId,
  circleOptions,
}: NewProductFormProps) {
  return (
    <Box
      as="form"
      id={formId}
      onSubmit={onSubmit}
      autoComplete="off"
      bg="bg.900"
      border="1px solid"
      borderColor="whiteAlpha.100"
      borderRadius="2xl"
      p={{ base: "5", md: "7" }}
    >
      <VStack spacing="5" align="stretch">
        <Box>
          <Text color="bg.300" fontSize="sm">
            Product line
          </Text>
          <Text color="bg.50" fontSize="xl" fontWeight="800">
            {productLineName}
          </Text>
        </Box>

        <FormControl isRequired>
          <FormLabel>Name</FormLabel>
          <ProductNameSelect
            value={name}
            options={productOptions}
            onNameChange={onNameChange}
            onProductSelect={onProductSelect}
            onCreateCustom={onCreateCustomProduct}
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Splash</FormLabel>
          <SearchableImageSelect
            ariaLabel="Select a splash"
            emptyLabel="No splashes found"
            options={splashOptions}
            placeholder="Select a splash"
            value={splashId}
            onChange={onVisualChange.splash}
            onShowMore={onShowMoreSplashes}
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Circle</FormLabel>
          <SearchableImageSelect
            ariaLabel="Select a circle"
            emptyLabel="No circles found"
            options={circleOptions}
            placeholder="Select a circle"
            value={circleId}
            onChange={onVisualChange.circle}
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Taste main image</FormLabel>
          <SearchableImageSelect
            ariaLabel="Select a taste main image"
            emptyLabel="No taste main images found"
            options={mainImageOptions}
            placeholder="Select a taste main image"
            value={mainImageId}
            onChange={onVisualChange.mainImage}
            onShowMore={onShowMoreMainImages}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Description</FormLabel>
          <Textarea
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            maxLength={2000}
            placeholder="Optional product description"
            bg="bg.800"
          />
        </FormControl>

        <Divider />

        <ProductComponentsTable
          components={components}
          dosage={dosage}
          rows={componentRows}
          onChange={onComponentRowsChange}
          onDosageChange={onDosageChange}
          onProductPurposeChange={onProductPurposeChange}
          onProductTypeChange={onProductTypeChange}
          onServingQuantityChange={onServingQuantityChange}
          onServingUnitChange={onServingUnitChange}
          servingQuantity={servingQuantity}
          servingUnit={servingUnit}
          productPurpose={productPurpose}
          productType={productType}
        />

        {error ? (
          <Alert status="error" borderRadius="xl">
            <AlertIcon />
            {error}
          </Alert>
        ) : null}
      </VStack>
    </Box>
  );
}
