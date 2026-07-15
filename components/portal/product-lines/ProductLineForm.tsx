import {
  Alert,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  VStack,
} from "@chakra-ui/react";
import type { FormEventHandler } from "react";
import {
  SearchableImageSelect,
  type SearchableImageOption,
} from "./SearchableImageSelect";

type ProductLineFormProps = {
  baseOptions: SearchableImageOption[];
  baseProductLineId: string;
  brandId: string;
  brandOptions: SearchableImageOption[];
  canSubmit: boolean;
  cupId: string;
  cupOptions: SearchableImageOption[];
  customSplashId: string;
  error?: string;
  isSubmitting: boolean;
  onBaseProductLineChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onCupChange: (value: string) => void;
  onCustomSplashChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  splashOptions: SearchableImageOption[];
  submitLabel?: string;
};

export function ProductLineForm({
  baseOptions,
  baseProductLineId,
  brandId,
  brandOptions,
  canSubmit,
  cupId,
  cupOptions,
  customSplashId,
  error,
  isSubmitting,
  onBaseProductLineChange,
  onBrandChange,
  onCupChange,
  onCustomSplashChange,
  onSubmit,
  splashOptions,
  submitLabel = "Create product line",
}: ProductLineFormProps) {
  return (
    <Box
      as="form"
      onSubmit={onSubmit}
      bg="bg.900"
      border="1px solid"
      borderColor="whiteAlpha.100"
      borderRadius="2xl"
      p={{ base: "5", md: "7" }}
    >
      <VStack spacing="5" align="stretch">
        <FormControl isRequired>
          <FormLabel>Product line name</FormLabel>
          <SearchableImageSelect
            ariaLabel="Select a product line name"
            emptyLabel="No root product lines found"
            options={baseOptions}
            placeholder="Search and select a product line"
            value={baseProductLineId}
            onChange={onBaseProductLineChange}
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Cup</FormLabel>
          <SearchableImageSelect
            ariaLabel="Select a cup"
            emptyLabel="No cups found"
            options={cupOptions}
            placeholder="Select a cup"
            value={cupId}
            onChange={onCupChange}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Custom splash</FormLabel>
          <SearchableImageSelect
            ariaLabel="Select a custom splash"
            emptyLabel="No empty splashes found"
            options={splashOptions}
            placeholder={cupId ? "Select a custom splash" : "Select a cup first"}
            value={customSplashId}
            onChange={onCustomSplashChange}
            clearLabel="Clear selected splash"
            isDisabled={!cupId}
          />
          <FormHelperText>
            {cupId
              ? "Only splashes marked as empty are available."
              : "Custom splash becomes available after selecting a cup."}
          </FormHelperText>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Brand</FormLabel>
          <SearchableImageSelect
            ariaLabel="Select a brand"
            emptyLabel="No brands found"
            options={brandOptions}
            placeholder="Select a brand"
            value={brandId}
            onChange={onBrandChange}
          />
        </FormControl>

        {error ? (
          <Alert status="error" borderRadius="xl">
            <AlertIcon />
            {error}
          </Alert>
        ) : null}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          isDisabled={!canSubmit}
        >
          {submitLabel}
        </Button>
      </VStack>
    </Box>
  );
}
