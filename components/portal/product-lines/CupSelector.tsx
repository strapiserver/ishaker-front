import { Box, Button, Image, SimpleGrid, Text } from "@chakra-ui/react";
import { getMediaUrl } from "../../../lib/portal/media";
import type { PortalCup } from "../../../types/portal";

type CupSelectorProps = {
  cups: PortalCup[];
  value: string;
  onChange: (value: string) => void;
};

export function CupSelector({ cups, value, onChange }: CupSelectorProps) {
  return (
    <Box py={{ base: "4", md: "6" }} w="full">
      <Text as="h3" color="bg.50" fontWeight="700" mb="4">
        Select cup
      </Text>
      {cups.length ? (
        <SimpleGrid
          columns={{ base: 2, lg: 3 }}
          spacing={{ base: "2", md: "4" }}
        >
          {cups.map((cup, index) => {
            const id = String(cup.id);
            const isSelected = id === value;
            return (
              <Button
                key={id}
                type="button"
                aria-label={`Select cup option ${index + 1}`}
                aria-pressed={isSelected}
                onClick={() => onChange(id)}
                variant="unstyled"
                display="flex"
                alignItems="center"
                justifyContent="center"
                h="auto"
                minH={{ base: "92px", md: "150px" }}
                p={{ base: "2", md: "3" }}
                border="2px solid"
                borderColor={isSelected ? "acid.300" : "whiteAlpha.100"}
                borderRadius="xl"
                bg={isSelected ? "whiteAlpha.100" : "bg.800"}
                boxShadow={
                  isSelected
                    ? "0 0 0 1px var(--chakra-colors-acid-300)"
                    : "none"
                }
                transition="border-color 0.15s ease, background 0.15s ease"
                _hover={{
                  borderColor: isSelected ? "acid.300" : "whiteAlpha.300",
                }}
                _focusVisible={{ boxShadow: "outline" }}
              >
                <Image
                  src={getMediaUrl(cup.image)}
                  alt=""
                  w="full"
                  h={{ base: "76px", md: "128px" }}
                  objectFit="contain"
                  draggable={false}
                />
              </Button>
            );
          })}
        </SimpleGrid>
      ) : (
        <Text color="bg.300">
          Select a product line to see its available cups.
        </Text>
      )}
    </Box>
  );
}
