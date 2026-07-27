import {
  Box,
  Button,
  HStack,
  IconButton,
  Image,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { KeyboardEvent, useMemo, useRef, useState } from "react";
import { FaChevronDown, FaTimes } from "react-icons/fa";
import { IoAddOutline } from "react-icons/io5";

export type ProductNameOption = {
  id: string;
  imageUrl?: string;
  name: string;
};

type ProductNameSelectProps = {
  onCreateCustom: () => void;
  onNameChange: (name: string) => void;
  onProductSelect: (product: ProductNameOption) => void;
  options: ProductNameOption[];
  value: string;
};

export function ProductNameSelect({
  onCreateCustom,
  onNameChange,
  onProductSelect,
  options,
  value,
}: ProductNameSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const selected = useMemo(
    () =>
      options.find(
        (option) =>
          option.name.toLocaleLowerCase() === value.trim().toLocaleLowerCase(),
      ),
    [options, value],
  );
  const normalizedCustomName = customName.trim().toLocaleLowerCase();
  const filteredOptions = useMemo(
    () =>
      normalizedCustomName
        ? options.filter((option) =>
            option.name.toLocaleLowerCase().includes(normalizedCustomName),
          )
        : options,
    [normalizedCustomName, options],
  );
  const customNameIsValid =
    customName.trim().length >= 2 &&
    !options.some(
      (option) =>
        option.name.toLocaleLowerCase() ===
        customName.trim().toLocaleLowerCase(),
    );

  const closeAndBlur = () => {
    setIsOpen(false);
    setCustomName("");
    triggerRef.current?.blur();
  };

  const createCustom = () => {
    if (!customNameIsValid) return;
    onNameChange(customName.trim());
    onCreateCustom();
    closeAndBlur();
  };

  const handleCustomKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    createCustom();
  };

  const customInput = (
    <HStack spacing="2">
      <Input
        value={customName}
        minLength={2}
        maxLength={100}
        placeholder="create custom"
        aria-label="Create custom product name"
        bg="bg.900"
        borderColor="whiteAlpha.200"
        onChange={(event) => setCustomName(event.target.value)}
        onKeyDown={handleCustomKeyDown}
      />
      <IconButton
        type="button"
        aria-label="Create custom product"
        icon={<IoAddOutline />}
        variant="primary"
        isDisabled={!customNameIsValid}
        onClick={createCustom}
      />
    </HStack>
  );

  const optionList = (maxHeight: string) => (
    <VStack spacing="1" maxH={maxHeight} overflowY="auto" align="stretch">
      {filteredOptions.map((option) => (
        <Button
          key={option.id}
          type="button"
          role="option"
          aria-selected={selected?.id === option.id}
          variant={selected?.id === option.id ? "primary" : "default"}
          h="56px"
          px="3"
          justifyContent="flex-start"
          flex="0 0 auto"
          onClick={() => {
            onProductSelect(option);
            closeAndBlur();
          }}
        >
          {option.imageUrl ? (
            <Image
              src={option.imageUrl}
              alt=""
              boxSize="34px"
              objectFit="cover"
              borderRadius="md"
              mr="3"
              flex="0 0 auto"
            />
          ) : (
            <Box
              boxSize="34px"
              borderRadius="md"
              bg="whiteAlpha.100"
              mr="3"
              flex="0 0 auto"
            />
          )}
          <Text noOfLines={1}>{option.name}</Text>
        </Button>
      ))}
      {!filteredOptions.length ? (
        <Text color="bg.300" py="4" textAlign="center">
          No products found.
        </Text>
      ) : null}
    </VStack>
  );

  return (
    <Box ref={containerRef} position="relative" w="full">
      <Button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-controls="product-name-options"
        aria-expanded={isOpen}
        aria-label="Select a product name"
        w="full"
        h="56px"
        px="4"
        bg="bg.800"
        border="1px solid"
        borderColor="whiteAlpha.200"
        color={value ? "bg.50" : "bg.300"}
        justifyContent="space-between"
        fontWeight="normal"
        _hover={{ borderColor: "whiteAlpha.400", bg: "bg.800" }}
        _focusVisible={{
          borderColor: "acid.300",
          boxShadow: "0 0 0 1px var(--chakra-colors-acid-300)",
        }}
        onClick={() => setIsOpen((current) => !current)}
        onBlur={() => {
          window.setTimeout(() => {
            if (!containerRef.current?.contains(document.activeElement)) {
              setIsOpen(false);
            }
          }, 0);
        }}
      >
        <HStack spacing="3" minW="0">
          {selected?.imageUrl ? (
            <Image
              src={selected.imageUrl}
              alt=""
              boxSize="34px"
              objectFit="cover"
              borderRadius="md"
            />
          ) : null}
          <Text noOfLines={1}>{value || "Select a product name"}</Text>
        </HStack>
        <Box
          as={FaChevronDown}
          color="bg.300"
          flex="0 0 auto"
          transform={isOpen ? "rotate(180deg)" : "rotate(0deg)"}
          transition="transform 160ms ease"
        />
      </Button>

      {isOpen ? (
        <>
          <Box
            id="product-name-options"
            role="listbox"
            display={{ base: "none", md: "block" }}
            position="absolute"
            zIndex="dropdown"
            top="calc(100% + 8px)"
            w="full"
            maxH="420px"
            overflow="hidden"
            bg="bg.800"
            border="1px solid"
            borderColor="whiteAlpha.200"
            borderRadius="md"
            boxShadow="xl"
            p="3"
          >
            <Box mb="3">{customInput}</Box>
            {optionList("320px")}
          </Box>

          <Box
            role="dialog"
            aria-modal="true"
            aria-label="Select a product name"
            display={{ base: "flex", md: "none" }}
            position="fixed"
            inset="0"
            zIndex="modal"
            bg="bg.900"
            flexDirection="column"
            p="4"
            pt="max(1rem, env(safe-area-inset-top))"
            pb="max(1rem, env(safe-area-inset-bottom))"
          >
            <HStack
              justify="space-between"
              pb="4"
              borderBottom="1px solid"
              borderColor="whiteAlpha.200"
            >
              <Text color="bg.50" fontSize="xl" fontWeight="800">
                Select a product name
              </Text>
              <IconButton
                aria-label="Close product selector"
                icon={<FaTimes />}
                variant="ghost"
                size="lg"
                onClick={closeAndBlur}
              />
            </HStack>
            <Box py="4">{customInput}</Box>
            <Box flex="1" minH="0">
              {optionList("full")}
            </Box>
          </Box>
        </>
      ) : null}
    </Box>
  );
}
