import {
  Box,
  Button,
  Image,
  Input,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { FaChevronDown } from "react-icons/fa";

export type SearchableImageOption = {
  id: string;
  name: string;
  imageUrl?: string;
  color?: string;
};

type SearchableImageSelectProps = {
  ariaLabel: string;
  emptyLabel: string;
  options: SearchableImageOption[];
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  clearLabel?: string;
};

export function SearchableImageSelect({
  ariaLabel,
  emptyLabel,
  options,
  placeholder,
  value,
  onChange,
  clearLabel,
}: SearchableImageSelectProps) {
  const [query, setQuery] = useState("");
  const selected = options.find((option) => option.id === value);
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return options;
    return options.filter((option) =>
      option.name.toLocaleLowerCase().includes(normalizedQuery),
    );
  }, [options, query]);

  return (
    <Popover placement="bottom-start" matchWidth isLazy>
      {({ onClose }) => (
        <>
          <PopoverTrigger>
            <Button
              aria-label={ariaLabel}
              variant="contrast"
              w="full"
              h="56px"
              justifyContent="space-between"
              rightIcon={<FaChevronDown />}
            >
              <Box display="flex" alignItems="center" gap="3" minW="0">
                {selected?.imageUrl ? (
                  <Image
                    src={selected.imageUrl}
                    alt=""
                    boxSize="36px"
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
                    flex="0 0 auto"
                  />
                ) : null}
                <Text noOfLines={1} color={selected ? "bg.50" : "bg.300"}>
                  {selected?.name || placeholder}
                </Text>
              </Box>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            bg="bg.800"
            borderColor="whiteAlpha.200"
            maxH="360px"
            overflow="hidden"
          >
            <PopoverBody p="3">
              <Input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name"
                bg="bg.900"
                mb="3"
              />
              <Stack spacing="1" maxH="270px" overflowY="auto">
                {clearLabel && value ? (
                  <Button
                    variant="default"
                    h="44px"
                    px="3"
                    justifyContent="flex-start"
                    color="bg.300"
                    onClick={() => {
                      onChange("");
                      setQuery("");
                      onClose();
                    }}
                  >
                    {clearLabel}
                  </Button>
                ) : null}
                {filteredOptions.map((option) => (
                  <Button
                    key={option.id}
                    variant={option.id === value ? "primary" : "default"}
                    h="52px"
                    px="3"
                    justifyContent="flex-start"
                    onClick={() => {
                      onChange(option.id);
                      setQuery("");
                      onClose();
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
                      <Box boxSize="36px" borderRadius="md" bg="whiteAlpha.100" mr="3" />
                    )}
                    <Text noOfLines={1}>{option.name}</Text>
                  </Button>
                ))}
                {!filteredOptions.length ? (
                  <Text color="bg.300" py="4" textAlign="center">
                    {emptyLabel}
                  </Text>
                ) : null}
              </Stack>
            </PopoverBody>
          </PopoverContent>
        </>
      )}
    </Popover>
  );
}
