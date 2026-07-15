import {
  Box,
  Button,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useMemo, useRef, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { IoAddOutline } from "react-icons/io5";
import type { PortalComponent } from "../../../../types/portal";

type ComponentNameSelectProps = {
  components: PortalComponent[];
  onCreateCustom: () => void;
  onNameChange: (name: string) => void;
  onSelect: (component: PortalComponent) => void;
  value: string;
};

export function ComponentNameSelect({
  components,
  onCreateCustom,
  onNameChange,
  onSelect,
  value,
}: ComponentNameSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const normalizedValue = value.trim().toLocaleLowerCase();
  const hasExactMatch = components.some(
    (component) => component.name.toLocaleLowerCase() === normalizedValue,
  );
  const filteredComponents = useMemo(() => {
    if (!normalizedValue || hasExactMatch) return components;
    return components.filter((component) =>
      component.name.toLocaleLowerCase().includes(normalizedValue),
    );
  }, [components, hasExactMatch, normalizedValue]);

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
          aria-controls="component-name-options"
          aria-expanded={isOpen}
          autoComplete="off"
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
          maxLength={100}
          placeholder="Search a component"
          h="40px"
          pr="48px"
          borderColor="whiteAlpha.200"
          color="bg.50"
          _placeholder={{ color: "bg.500" }}
          _hover={{ borderColor: "whiteAlpha.400" }}
          _focusVisible={{
            borderColor: "acid.300",
            boxShadow: "0 0 0 1px var(--chakra-colors-acid-300)",
          }}
        />
        <InputRightElement h="40px" pointerEvents="none" color="bg.300">
          <Box as={FaSearch} />
        </InputRightElement>
      </InputGroup>

      {isOpen ? (
        <Box
          id="component-name-options"
          role="listbox"
          position="absolute"
          zIndex="dropdown"
          top="calc(100% + 8px)"
          w="200%"
          maxH="360px"
          overflow="hidden"
          border="1px solid"
          borderColor="whiteAlpha.200"
          borderRadius="md"
          boxShadow="xl"
          p="3"
          bg="bg.800"
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
            Add custom
          </Button>
          <VStack spacing="1" maxH="270px" overflowY="auto" align="stretch">
            {filteredComponents.map((component) => (
              <Button
                key={component.id}
                role="option"
                variant="default"
                h="52px"
                px="3"
                onClick={() => {
                  onSelect(component);
                  closeAndBlur();
                }}
              >
                <HStack w="full" justify="space-between" minW="0">
                  <Text noOfLines={1}>{component.name}</Text>
                  <Text color="bg.300" fontSize="sm" flex="0 0 auto">
                    {component.unit || "—"}
                  </Text>
                </HStack>
              </Button>
            ))}
            {!filteredComponents.length ? (
              <Text color="bg.300" py="4" textAlign="center">
                No components found.
              </Text>
            ) : null}
          </VStack>
        </Box>
      ) : null}
    </Box>
  );
}
