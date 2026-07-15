import { Box, HStack, Image, Text, VStack } from "@chakra-ui/react";
import { useMemo } from "react";
import { SPLASH_FADE_MS, useSplashAnimation } from "../../home/Splash";
import { capitalizeName } from "../../../lib/formatName";
import { getMediaUrl } from "../../../lib/portal/media";
import type { PortalBrand, PortalCup } from "../../../types/portal";
// import { GiPowder } from "react-icons/gi";
// import { FaBottleWater } from "react-icons/fa6";

type CupPreviewProps = {
  brand?: PortalBrand;
  cup?: PortalCup;
  isSplashLoading?: boolean;
  productLineName?: string;
  splashError?: boolean;
  splashFrames?: string[];
  splashIsEmpty?: boolean;
};

export function CupPreview({
  brand,
  cup,
  isSplashLoading = false,
  productLineName,
  splashError = false,
  splashFrames = [],
  splashIsEmpty,
}: CupPreviewProps) {
  const splashSets = useMemo(
    () => (splashFrames.length ? [splashFrames] : []),
    [splashFrames],
  );
  const { activeFrame, isFading } = useSplashAnimation(
    splashSets,
    Boolean(cup),
  );
  const cupImage = getMediaUrl(cup?.image);
  const brandImage = getMediaUrl(brand?.logo);

  return (
    <Box
      bgGradient="linear(to-br, bg.900, bg.800)"
      border="1px solid"
      borderColor="whiteAlpha.100"
      borderRadius="2xl"
      minH="680px"
      px={{ base: "5", md: "7" }}
      py={{ base: "1", md: "2" }}
      overflow="hidden"
      position="relative"
    >
      <HStack w="100%" justify="space-between" spacing="4" mb="4">
        <VStack spacing="1" position="relative" zIndex="5" align="stretch">
          <Text
            color="acid.300"
            fontSize="sm"
            fontWeight="800"
            letterSpacing="0.08em"
            textTransform="uppercase"
          >
            ● Live preview
          </Text>
          <HStack>
            {brand ? (
              <Text fontSize="lg" zIndex="6" color="bg.300">
                {`${capitalizeName(brand.name)} •`}
              </Text>
            ) : null}
            <Text color="bg.50" fontSize="lg" fontWeight="800" noOfLines={1}>
              {capitalizeName(productLineName) || "Your product line"}
            </Text>
          </HStack>
          <Text>Client will see this cup:</Text>
        </VStack>

        {brand && brandImage ? (
          <Image
            src={brandImage}
            alt={capitalizeName(brand.name)}
            maxW="200px"
            maxH="88px"
            objectFit="contain"
          />
        ) : null}
      </HStack>

      {isSplashLoading ? (
        <Text
          position="absolute"
          left="7"
          top="28"
          zIndex="6"
          color="bg.300"
          fontSize="sm"
        >
          Loading custom splash…
        </Text>
      ) : null}
      {splashError ? (
        <Text
          position="absolute"
          left="7"
          top="28"
          zIndex="6"
          color="red.300"
          fontSize="sm"
        >
          Custom splash could not be loaded.
        </Text>
      ) : null}

      <Box
        aria-label={
          cup
            ? `${capitalizeName(cup.name)} with ${
                splashIsEmpty ? "empty" : "flavor"
              } animated splash`
            : "Cup preview"
        }
        role="img"
        position="absolute"
        data-splash-is-empty={
          typeof splashIsEmpty === "boolean" ? String(splashIsEmpty) : undefined
        }
        left="50%"
        bottom="6"
        transform="translateX(-50%)"
        w="58%"
        maxW="420px"
        aspectRatio="1"
      >
        {/* Cup and splash share this single coordinate space. Move or scale this
            wrapper to keep their relative position rigidly linked. */}
        <Box position="absolute" inset="0" data-cup-scene>
          {cup && activeFrame ? (
            <Box
              as="img"
              src={activeFrame}
              alt=""
              draggable={false}
              position="absolute"
              zIndex="3"
              left="1%"
              top="-94%"
              w="full"
              h="full"
              objectFit="contain"
              opacity={isFading ? 0 : 1}
              transition={`opacity ${SPLASH_FADE_MS / 1000}s ease`}
              pointerEvents="none"
            />
          ) : null}
          {cupImage ? (
            <Box
              as="img"
              src={cupImage}
              alt={capitalizeName(cup?.name) || "Selected cup"}
              draggable={false}
              position="absolute"
              inset="0"
              zIndex="2"
              w="100%"
              h="100%"
              objectFit="contain"
              filter="drop-shadow(0 24px 40px rgba(0, 0, 0, 0.35))"
            />
          ) : (
            <VStack
              h="full"
              align="center"
              justify="center"
              color="bg.400"
              textAlign="center"
            >
              <Text fontSize="6xl">+</Text>
              <Text>Select a cup to start the animation</Text>
            </VStack>
          )}
        </Box>
      </Box>
    </Box>
  );
}
