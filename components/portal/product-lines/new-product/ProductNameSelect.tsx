import {
  Box,
  Button,
  Icon,
  Image,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useMemo, useRef, useState } from "react";
import { FaSearch } from "react-icons/fa";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const normalizedValue = value.trim().toLocaleLowerCase();
  const hasExactMatch = options.some(
    (option) => option.name.toLocaleLowerCase() === normalizedValue,
  );
  const filteredOptions = useMemo(() => {
    if (!normalizedValue || hasExactMatch) return options;
    return options.filter((option) =>
      option.name.toLocaleLowerCase().includes(normalizedValue),
    );
  }, [hasExactMatch, normalizedValue, options]);

  const closeAndBlur = () => {
    setIsOpen(false);
    inputRef.current?.blur();
  };

  return (
    <Box ref={containerRef} position="relative" w="full">
      <InputGroup size="lg">
        <Input
          ref={inputRef}
          role="combobox"
          aria-autocomplete="list"
          aria-controls="product-name-options"
          aria-expanded={isOpen}
          name="flavor-name"
          autoComplete="new-password"
          spellCheck={false}
          value={value}
          onChange={(event) => {
            onNameChange(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
          onBlur={() => {
            window.setTimeout(() => {
              if (!containerRef.current?.contains(document.activeElement)) {
                setIsOpen(false);
              }
            }, 0);
          }}
          minLength={2}
          maxLength={100}
          placeholder="Flavor name"
          h="56px"
          pr="48px"
          bg="bg.800"
          borderColor="whiteAlpha.200"
          color="bg.50"
          _placeholder={{ color: "bg.300" }}
          _hover={{ borderColor: "whiteAlpha.400" }}
          _focusVisible={{
            borderColor: "acid.300",
            boxShadow: "0 0 0 1px var(--chakra-colors-acid-300)",
          }}
        />
        <InputRightElement h="56px" pointerEvents="none" color="bg.300">
          <Icon as={FaSearch} />
        </InputRightElement>
      </InputGroup>

      {isOpen ? (
        <Box
          id="product-name-options"
          role="listbox"
          position="absolute"
          zIndex="dropdown"
          top="calc(100% + 8px)"
          w="full"
          maxH="360px"
          overflow="hidden"
          bg="bg.800"
          border="1px solid"
          borderColor="whiteAlpha.200"
          borderRadius="md"
          boxShadow="xl"
          p="3"
          onMouseDown={(event) => event.preventDefault()}
        >
          <Button
            variant="outline"
            w="full"
            mb="2"
            isDisabled={!value.trim() || hasExactMatch}
            leftIcon={<IoAddOutline size="1rem" />}
            onClick={() => {
              onCreateCustom();
              closeAndBlur();
            }}
          >
            Create custom
          </Button>
          <VStack spacing="1" maxH="270px" overflowY="auto" align="stretch">
            {filteredOptions.map((option) => (
              <Button
                key={option.id}
                role="option"
                variant="default"
                h="52px"
                px="3"
                justifyContent="flex-start"
                onClick={() => {
                  onProductSelect(option);
                  closeAndBlur();
                }}
              >
                {option.imageUrl ? (
                  <Image
                    src={option.imageUrl}
                    alt=""
                    boxSize="30px"
                    objectFit="cover"
                    borderRadius="md"
                    mr="3"
                    flex="0 0 auto"
                  />
                ) : (
                  <Box
                    boxSize="30px"
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
        </Box>
      ) : null}
    </Box>
  );
}
