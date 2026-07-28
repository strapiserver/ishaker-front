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
  canSubmit: boolean;
  customSplashId: string;
  error?: string;
  isSubmitting: boolean;
  onBaseProductLineChange: (value: string) => void;
  onCustomSplashChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  splashOptions: SearchableImageOption[];
  submitLabel?: string;
};

export function ProductLineForm({
  baseOptions,
  baseProductLineId,
  canSubmit,
  customSplashId,
  error,
  isSubmitting,
  onBaseProductLineChange,
  onCustomSplashChange,
  onSubmit,
  splashOptions,
  submitLabel = "Create product line",
}: ProductLineFormProps) {
  return (
    <Box
      as="form"
      onSubmit={onSubmit}
      autoComplete="off"
      bg="bg.900"
      border="1px solid"
      borderColor="whiteAlpha.100"
      borderRadius="2xl"
      p={{ base: "5", md: "7" }}
    >
      <VStack spacing="5" align="stretch">
        <FormControl isRequired>
          <FormLabel>Product line</FormLabel>
          <SearchableImageSelect
            ariaLabel="Select a product line"
            emptyLabel="No root product lines found"
            options={baseOptions}
            placeholder="Select a product line"
            value={baseProductLineId}
            onChange={onBaseProductLineChange}
            isSearchable={false}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Custom splash</FormLabel>
          <SearchableImageSelect
            ariaLabel="Select a custom splash"
            emptyLabel="No empty splashes found"
            options={splashOptions}
            value={customSplashId}
            placeholder={
              baseProductLineId
                ? "Select a custom splash"
                : "Select a product line first"
            }
            onChange={onCustomSplashChange}
            clearLabel="Clear selected splash"
            isDisabled={!baseProductLineId}
            isSearchable={false}
          />
          <FormHelperText>
            {baseProductLineId
              ? "Only splashes marked as empty are available."
              : "Custom splash becomes available after selecting a product line."}
          </FormHelperText>
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
