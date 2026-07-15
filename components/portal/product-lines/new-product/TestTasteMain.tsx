import {
  Alert,
  AlertIcon,
  Box,
  Button,
  HStack,
  Image,
  SimpleGrid,
  Text,
  VStack,
  useBreakpointValue,
} from "@chakra-ui/react";
import { useState } from "react";
import { capitalizeName } from "../../../../lib/formatName";
import { getSmallestMediaUrl } from "../../../../lib/portal/media";
import type { PortalTaste } from "../../../../types/portal";

type TestTasteMainProps = {
  onSelect: (mainImageId: string) => void;
  selectedMainImageId?: string;
  tastes: PortalTaste[];
};

export function TestTasteMain({
  onSelect,
  selectedMainImageId,
  tastes,
}: TestTasteMainProps) {
  const [page, setPage] = useState(0);
  const pageSize = useBreakpointValue({ base: 6, md: 10 }) || 6;
  const options = tastes.filter((taste) => Boolean(taste.main?.id));
  const pageCount = Math.max(Math.ceil(options.length / pageSize), 1);
  const safePage = Math.min(page, pageCount - 1);
  const visibleTastes = options.slice(
    safePage * pageSize,
    (safePage + 1) * pageSize,
  );

  return (
    <Box>
      {visibleTastes.length ? (
        <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} spacing="4">
          {visibleTastes.map((taste) => {
            const mainImageId = String(taste.main!.id);
            const isSelected = mainImageId === selectedMainImageId;
            return (
              <VStack
                key={taste.id}
                as="button"
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelect(mainImageId)}
                spacing="3"
                bg="bg.900"
                border="1px solid"
                borderColor={isSelected ? "acid.300" : "whiteAlpha.100"}
                borderRadius="xl"
                p="4"
                minW="0"
                cursor="pointer"
                transition="border-color 160ms ease, transform 160ms ease"
                _hover={{ borderColor: "acid.300", transform: "translateY(-2px)" }}
                _focusVisible={{
                  borderColor: "acid.300",
                  boxShadow: "0 0 0 2px var(--chakra-colors-acid-300)",
                  outline: "none",
                }}
              >
                <Box w="full" aspectRatio="1">
                  <Image
                    src={getSmallestMediaUrl(taste.main)}
                    alt=""
                    w="full"
                    h="full"
                    objectFit="contain"
                  />
                </Box>
                <Text color="bg.50" fontWeight="700" textAlign="center" noOfLines={2}>
                  {capitalizeName(taste.name)}
                </Text>
              </VStack>
            );
          })}
        </SimpleGrid>
      ) : (
        <Alert status="info" borderRadius="xl">
          <AlertIcon />
          No taste main images found.
        </Alert>
      )}

      <HStack mt="5" justify="space-between">
        <Button
          onClick={() => setPage(Math.max(safePage - 1, 0))}
          isDisabled={safePage === 0}
        >
          Previous {pageSize}
        </Button>
        <Text color="bg.300">
          {safePage + 1} / {pageCount}
        </Text>
        <Button
          onClick={() => setPage(Math.min(safePage + 1, pageCount - 1))}
          isDisabled={safePage >= pageCount - 1}
        >
          Next {pageSize}
        </Button>
      </HStack>
    </Box>
  );
}
