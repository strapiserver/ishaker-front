import {
  Box,
  Button,
  HStack,
  IconButton,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { KeyboardEvent, useId, useMemo, useRef, useState } from "react";
import { FaChevronDown, FaTimes } from "react-icons/fa";
import { IoAddOutline } from "react-icons/io5";
import type { PortalComponent } from "../../../../types/portal";

type ComponentNameSelectProps = {
  components: PortalComponent[];
  onCreateCustom: (name: string) => void;
  onSelect: (component: PortalComponent) => void;
  value: string;
};

export function ComponentNameSelect({
  components,
  onCreateCustom,
  onSelect,
  value,
}: ComponentNameSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = `component-name-${useId().replace(/:/g, "")}`;
  const [isOpen, setIsOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const normalizedCustomName = customName.trim().toLocaleLowerCase();
  const selected = useMemo(
    () =>
      components.find(
        (component) =>
          component.name.toLocaleLowerCase() ===
          value.trim().toLocaleLowerCase(),
      ),
    [components, value],
  );
  const filteredComponents = useMemo(
    () =>
      normalizedCustomName
        ? components.filter((component) =>
            component.name
              .toLocaleLowerCase()
              .includes(normalizedCustomName),
          )
        : components,
    [components, normalizedCustomName],
  );
  const customNameIsValid =
    customName.trim().length >= 2 &&
    !components.some(
      (component) =>
        component.name.toLocaleLowerCase() === normalizedCustomName,
    );

  const closeAndBlur = () => {
    setIsOpen(false);
    setCustomName("");
    triggerRef.current?.blur();
  };

  const createCustom = () => {
    if (!customNameIsValid) return;
    onCreateCustom(customName.trim());
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
        aria-label="Create custom ingredient name"
        bg="bg.900"
        borderColor="whiteAlpha.200"
        onChange={(event) => setCustomName(event.target.value)}
        onKeyDown={handleCustomKeyDown}
      />
      <IconButton
        type="button"
        aria-label="Create custom ingredient"
        icon={<IoAddOutline />}
        variant="primary"
        isDisabled={!customNameIsValid}
        onClick={createCustom}
      />
    </HStack>
  );

  const optionList = (maxHeight: string) => (
    <VStack spacing="1" maxH={maxHeight} overflowY="auto" align="stretch">
      {filteredComponents.map((component) => (
        <Button
          key={component.id}
          type="button"
          role="option"
          aria-selected={selected?.id === component.id}
          variant={selected?.id === component.id ? "primary" : "default"}
          h="52px"
          px="3"
          flex="0 0 auto"
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
  );

  return (
    <Box ref={containerRef} position="relative" w="full">
      <Button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-label="Select an ingredient name"
        w="full"
        h="40px"
        px="3"
        bg="transparent"
        border="1px solid"
        borderColor="whiteAlpha.200"
        color={value ? "bg.50" : "bg.500"}
        justifyContent="space-between"
        fontWeight="normal"
        _hover={{ borderColor: "whiteAlpha.400" }}
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
        <Text noOfLines={1}>{value || "Select ingredient"}</Text>
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
            id={listboxId}
            role="listbox"
            display={{ base: "none", md: "block" }}
            position="absolute"
            zIndex="dropdown"
            top="calc(100% + 8px)"
            w="200%"
            maxH="420px"
            overflow="hidden"
            border="1px solid"
            borderColor="whiteAlpha.200"
            borderRadius="md"
            boxShadow="xl"
            p="3"
            bg="bg.800"
          >
            <Box mb="3">{customInput}</Box>
            {optionList("320px")}
          </Box>

          <Box
            role="dialog"
            aria-modal="true"
            aria-label="Select an ingredient name"
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
                Select an ingredient
              </Text>
              <IconButton
                type="button"
                aria-label="Close ingredient selector"
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
