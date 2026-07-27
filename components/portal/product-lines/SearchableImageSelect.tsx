import {
  Badge,
  Box,
  Button,
  HStack,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  VStack,
  Text,
} from "@chakra-ui/react";
import { useId, useMemo, useRef, useState } from "react";
import { FaChevronDown, FaImages, FaTimes } from "react-icons/fa";

export type SearchableImageOption = {
  id: string;
  name: string;
  imageUrl?: string;
  color?: string;
  subtitle?: string;
  subtitleColor?: string;
  badge?: string;
  badgeColorScheme?: string;
};

export type SearchableImageSelectProps = {
  ariaLabel: string;
  emptyLabel: string;
  options: SearchableImageOption[];
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  clearLabel?: string;
  isDisabled?: boolean;
  isSearchable?: boolean;
  onShowMore?: () => void;
};

export function SearchableImageSelect({
  ariaLabel,
  emptyLabel,
  options,
  placeholder,
  value,
  onChange,
  clearLabel,
  isDisabled = false,
  isSearchable = true,
  onShowMore,
}: SearchableImageSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLInputElement | HTMLButtonElement>(null);
  const inputName = `portal-combobox-${useId().replace(/:/g, "")}`;
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((option) => option.id === value);
  const listboxId = `${ariaLabel.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-")}-options`;
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return options;
    return options.filter((option) =>
      option.name.toLocaleLowerCase().includes(normalizedQuery),
    );
  }, [options, query]);

  const closeAndBlur = () => {
    setIsOpen(false);
    setQuery("");
    triggerRef.current?.blur();
  };

  const optionList = (maxHeight: string) => (
    <VStack spacing="1" maxH={maxHeight} overflowY="auto" align="stretch">
      {clearLabel && value ? (
        <Button
          variant="default"
          h="52px"
          px="3"
          justifyContent="flex-start"
          color="bg.300"
          flex="0 0 auto"
          onClick={() => {
            onChange("");
            closeAndBlur();
          }}
        >
          {clearLabel}
        </Button>
      ) : null}
      {filteredOptions.map((option) => (
        <Button
          key={option.id}
          role="option"
          aria-selected={option.id === value}
          variant={option.id === value ? "primary" : "default"}
          h="52px"
          px="3"
          justifyContent="flex-start"
          flex="0 0 auto"
          onClick={() => {
            onChange(option.id);
            closeAndBlur();
          }}
        >
          {option.imageUrl ? (
            <Image
              src={option.imageUrl}
              alt=""
              boxSize="36px"
              objectFit="contain"
              borderRadius="md"
              bg="whiteAlpha.100"
              mr="3"
            />
          ) : option.color ? (
            <Box
              aria-hidden="true"
              boxSize="36px"
              borderRadius="md"
              bg={option.color}
              border="1px solid"
              borderColor="whiteAlpha.300"
              mr="3"
              flex="0 0 auto"
            />
          ) : (
            <Box
              boxSize="36px"
              borderRadius="md"
              bg="whiteAlpha.100"
              mr="3"
              flex="0 0 auto"
            />
          )}
          <VStack spacing="0" minW="0" textAlign="left" align="stretch">
            <Box display="flex" alignItems="center" gap="2" minW="0">
              <Text noOfLines={1}>{option.name}</Text>
              {option.badge ? (
                <Badge
                  colorScheme={option.badgeColorScheme || "gray"}
                  flex="0 0 auto"
                >
                  {option.badge}
                </Badge>
              ) : null}
            </Box>
            {option.subtitle ? (
              <Text
                fontSize="xs"
                color={option.subtitleColor || "bg.300"}
              >
                {option.subtitle}
              </Text>
            ) : null}
          </VStack>
        </Button>
      ))}
      {!filteredOptions.length ? (
        <Text color="bg.300" py="4" textAlign="center">
          {emptyLabel}
        </Text>
      ) : null}
    </VStack>
  );

  return (
    <Box
      ref={containerRef}
      position="relative"
      w="full"
      pointerEvents={isDisabled ? "none" : "auto"}
    >
      {isSearchable ? (
        <InputGroup size="lg">
          {selected?.imageUrl ? (
            <InputLeftElement h="56px" w="52px" pointerEvents="none">
              <Image
                src={selected.imageUrl}
                alt=""
                boxSize="34px"
                objectFit="contain"
                borderRadius="md"
                bg="whiteAlpha.100"
              />
            </InputLeftElement>
          ) : selected?.color ? (
            <InputLeftElement h="56px" w="52px" pointerEvents="none">
              <Box
                aria-hidden="true"
                boxSize="28px"
                borderRadius="md"
                bg={selected.color}
                border="1px solid"
                borderColor="whiteAlpha.300"
              />
            </InputLeftElement>
          ) : null}
          <Input
            ref={triggerRef as React.RefObject<HTMLInputElement>}
            role="combobox"
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={isOpen}
            aria-label={ariaLabel}
            name={inputName}
            autoComplete="one-time-code"
            data-1p-ignore
            data-form-type="other"
            data-lpignore="true"
            spellCheck={false}
            value={isOpen ? query : selected?.name || ""}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              if (!isOpen) setQuery("");
              setIsOpen(true);
            }}
            onClick={() => setIsOpen(true)}
            onBlur={() => {
              window.setTimeout(() => {
                if (!containerRef.current?.contains(document.activeElement)) {
                  setIsOpen(false);
                  setQuery("");
                }
              }, 0);
            }}
            placeholder={placeholder}
            isDisabled={isDisabled}
            h="56px"
            pl={selected?.imageUrl || selected?.color ? "52px" : "4"}
            pr="44px"
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
            <Box
              as={FaChevronDown}
              transform={isOpen ? "rotate(180deg)" : "rotate(0deg)"}
              transition="transform 160ms ease"
            />
          </InputRightElement>
        </InputGroup>
      ) : (
        <Button
          ref={triggerRef as React.RefObject<HTMLButtonElement>}
          type="button"
          role="combobox"
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-label={ariaLabel}
          isDisabled={isDisabled}
          w="full"
          h="56px"
          px="4"
          bg="bg.800"
          border="1px solid"
          borderColor="whiteAlpha.200"
          color={selected ? "bg.50" : "bg.300"}
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
          <Box display="flex" alignItems="center" gap="3" minW="0">
            {selected?.imageUrl ? (
              <Image
                src={selected.imageUrl}
                alt=""
                boxSize="34px"
                objectFit="contain"
                borderRadius="md"
                bg="whiteAlpha.100"
              />
            ) : selected?.color ? (
              <Box
                aria-hidden="true"
                boxSize="28px"
                borderRadius="md"
                bg={selected.color}
                border="1px solid"
                borderColor="whiteAlpha.300"
              />
            ) : null}
            <Text noOfLines={1}>{selected?.name || placeholder}</Text>
          </Box>
          <Box
            as={FaChevronDown}
            flex="0 0 auto"
            color="bg.300"
            transform={isOpen ? "rotate(180deg)" : "rotate(0deg)"}
            transition="transform 160ms ease"
          />
        </Button>
      )}
      {selected?.subtitle && !isOpen ? (
        <Text
          mt="1"
          ml="1"
          fontSize="xs"
          color={selected.subtitleColor || "bg.300"}
        >
          {selected.subtitle}
        </Text>
      ) : null}

      {isOpen ? (
        <>
          <Box
            id={listboxId}
            role="listbox"
            display={{ base: "none", md: "block" }}
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
            {onShowMore ? (
              <Button
                variant="no_contrast"
                w="full"
                my="4"
                leftIcon={<FaImages size="1rem" />}
                onClick={() => {
                  onShowMore();
                  closeAndBlur();
                }}
              >
                Show images
              </Button>
            ) : null}
            {optionList("270px")}
          </Box>

          <Box
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
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
                {ariaLabel}
              </Text>
              <IconButton
                aria-label="Close selector"
                icon={<FaTimes />}
                variant="ghost"
                size="lg"
                onClick={closeAndBlur}
              />
            </HStack>

            {isSearchable ? (
              <Input
                mt="4"
                mb="3"
                size="lg"
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={placeholder}
                bg="bg.800"
                borderColor="whiteAlpha.200"
              />
            ) : null}
            {onShowMore ? (
              <Button
                variant="no_contrast"
                w="full"
                my="3"
                leftIcon={<FaImages size="1rem" />}
                onClick={() => {
                  onShowMore();
                  closeAndBlur();
                }}
              >
                Show images
              </Button>
            ) : null}
            <Box flex="1" minH="0" pt="3">
              {optionList("full")}
            </Box>
          </Box>
        </>
      ) : null}
    </Box>
  );
}
