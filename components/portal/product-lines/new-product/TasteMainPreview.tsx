import { Box, Text, VStack } from "@chakra-ui/react";
import { getMediaUrl } from "../../../../lib/portal/media";
import type { PortalCircle, PortalMedia } from "../../../../types/portal";

type TasteMainPreviewProps = {
  circle?: PortalCircle | null;
  main?: PortalMedia | null;
};

export function TasteMainPreview({ circle, main }: TasteMainPreviewProps) {
  const circleImage = getMediaUrl(circle?.images?.[0]);
  const mainImage = getMediaUrl(main);

  return (
    <Box
      bg="bg.900"
      border="1px solid"
      borderColor="whiteAlpha.100"
      borderRadius="2xl"
      p={{ base: "5", md: "7" }}
    >
      <Text color="bg.50" fontSize="lg" fontWeight="800" mb="4">
        Taste preview
      </Text>
      {circleImage || mainImage ? (
        <Box
          aria-label="Selected taste main image with spinning circle"
          role="img"
          position="relative"
          mx="auto"
          w="full"
          maxW="320px"
          aspectRatio="1"
        >
          {circleImage ? (
            <Box
              as="img"
              src={circleImage}
              alt=""
              draggable={false}
              position="absolute"
              inset="-5%"
              zIndex="0"
              w="110%"
              h="110%"
              objectFit="contain"
              animation="taste-circle-spin 1s linear infinite"
              sx={{
                "@keyframes taste-circle-spin": {
                  "0%": { transform: "rotate(0deg)" },
                  "100%": { transform: "rotate(360deg)" },
                },
              }}
            />
          ) : null}
          {mainImage ? (
            <Box
              as="img"
              src={mainImage}
              alt="Selected taste"
              draggable={false}
              position="relative"
              zIndex="1"
              w="full"
              h="full"
              objectFit="contain"
            />
          ) : null}
        </Box>
      ) : (
        <VStack minH="240px" justify="center" color="bg.300">
          <Text>Select a taste main image and circle.</Text>
        </VStack>
      )}
    </Box>
  );
}
