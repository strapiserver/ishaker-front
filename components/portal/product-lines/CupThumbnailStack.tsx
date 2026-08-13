import { Box, HStack, Image, Text, Tooltip } from "@chakra-ui/react";
import { capitalizeName } from "../../../lib/formatName";
import { getSmallestMediaUrl } from "../../../lib/portal/media";
import type { PortalCup } from "../../../types/portal";

type CupThumbnailStackProps = {
  cups?: PortalCup[];
};

export function CupThumbnailStack({ cups = [] }: CupThumbnailStackProps) {
  if (!cups.length) {
    return (
      <Text color="whiteAlpha.500" fontSize="xs">
        No cups
      </Text>
    );
  }

  const visibleCups = cups.slice(0, 3);
  const hiddenCount = cups.length - visibleCups.length;
  const label = cups
    .map((cup, index) => `${index + 1}. ${capitalizeName(cup.name)}`)
    .join("\n");

  return (
    <Tooltip label={<Text whiteSpace="pre-line">{label}</Text>} hasArrow>
      <HStack spacing="0" aria-label={`${cups.length} selected cups`}>
        {visibleCups.map((cup, index) => (
          <Box
            key={cup.id}
            boxSize="32px"
            ml={index ? "-2" : "0"}
            position="relative"
            zIndex={visibleCups.length - index}
            border="1px solid"
            borderColor="whiteAlpha.300"
            borderRadius="full"
            bg="bg.800"
            overflow="hidden"
          >
            <Image
              src={getSmallestMediaUrl(cup.image)}
              alt=""
              boxSize="full"
              objectFit="contain"
              p="0.5"
            />
          </Box>
        ))}
        {hiddenCount > 0 ? (
          <Box
            ml="-1"
            minW="32px"
            h="32px"
            px="1"
            border="1px solid"
            borderColor="whiteAlpha.300"
            borderRadius="full"
            bg="bg.700"
            color="whiteAlpha.800"
            fontSize="xs"
            fontWeight="800"
            lineHeight="30px"
            textAlign="center"
          >
            +{hiddenCount}
          </Box>
        ) : null}
      </HStack>
    </Tooltip>
  );
}
