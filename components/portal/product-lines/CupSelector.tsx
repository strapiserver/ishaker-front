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
      <Text color="bg.50" mb="1">
        Default cup
      </Text>
      <Text color="bg.300" fontSize="sm" mb="4">
        You will be able to change it for each product later.
      </Text>
      {cups.length ? (
        <SimpleGrid
          columns={{ base: 2, lg: 3 }}
          columnGap={{ base: "1", md: "2" }}
          rowGap={{ base: "2", md: "4" }}
        >
          {cups.map((cup, index) => {
            const id = String(cup.id);
            const isSelected = value === id;
            return (
              <Button
                key={id}
                type="button"
                aria-label={`Select cup option ${index + 1}`}
                aria-pressed={isSelected}
                onClick={() => onChange(id)}
                position="relative"
                variant="unstyled"
                display="flex"
                alignItems="center"
                justifyContent="center"
                h="auto"
                minH={{ base: "132px", md: "196px" }}
                p={{ base: "1", md: "2" }}
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
                  h={{ base: "116px", md: "176px" }}
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
