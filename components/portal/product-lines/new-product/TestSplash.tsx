import {
  Alert,
  AlertIcon,
  Box,
  Button,
  HStack,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
  useBreakpointValue,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import useSWR from "swr";
import {
  SPLASH_FADE_MS,
  useSplashAnimation,
} from "../../../home/Splash";
import { capitalizeName } from "../../../../lib/formatName";
import { getSmallestMediaUrl } from "../../../../lib/portal/media";
import type { PortalSplash } from "../../../../types/portal";

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.message || "Request failed.");
  return payload as T;
};

const sortFramesByName = <T extends { name?: string; url?: string }>(
  frames: T[] = [],
) =>
  [...frames].sort((left, right) =>
    (left.name || left.url || "").localeCompare(
      right.name || right.url || "",
      undefined,
      { numeric: true, sensitivity: "base" },
    ),
  );

type TestSplashItemProps = {
  isSelected: boolean;
  onSelect: () => void;
  splash: PortalSplash;
};

function TestSplashItem({
  isSelected,
  onSelect,
  splash,
}: TestSplashItemProps) {
  const { data, error, isLoading } = useSWR<{ splash: PortalSplash }>(
    `/api/portal/splashes/${splash.id}`,
    fetcher,
  );
  const frames = useMemo(
    () =>
      sortFramesByName(data?.splash.images)
        .map((image) => getSmallestMediaUrl(image))
        .filter(Boolean),
    [data],
  );
  const splashSets = useMemo(() => (frames.length ? [frames] : []), [frames]);
  const { activeFrame, isFading } = useSplashAnimation(splashSets, true);

  return (
    <VStack
      as="button"
      type="button"
      aria-pressed={isSelected}
      onClick={onSelect}
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
      <Box position="relative" w="full" aspectRatio="1">
        {isLoading ? (
          <Spinner
            position="absolute"
            left="50%"
            top="50%"
            transform="translate(-50%, -50%)"
            color="acid.300"
          />
        ) : activeFrame ? (
          <Box
            as="img"
            src={activeFrame}
            alt=""
            draggable={false}
            position="absolute"
            inset="0"
            w="full"
            h="full"
            objectFit="contain"
            opacity={isFading ? 0 : 1}
            transition={`opacity ${SPLASH_FADE_MS / 1000}s ease`}
          />
        ) : (
          <Text
            position="absolute"
            left="50%"
            top="50%"
            transform="translate(-50%, -50%)"
            color={error ? "red.300" : "bg.300"}
            fontSize="sm"
            textAlign="center"
          >
            {error ? "Could not load" : "No frames"}
          </Text>
        )}
      </Box>
      <Text color="bg.50" fontWeight="700" textAlign="center" noOfLines={2}>
        {capitalizeName(splash.name)}
      </Text>
    </VStack>
  );
}

type TestSplashProps = {
  onSelect: (splashId: string) => void;
  selectedSplashId?: string;
  splashes: PortalSplash[];
};

export function TestSplash({
  onSelect,
  selectedSplashId,
  splashes,
}: TestSplashProps) {
  const [page, setPage] = useState(0);
  const pageSize = useBreakpointValue({ base: 6, md: 10 }) || 6;
  const pageCount = Math.max(Math.ceil(splashes.length / pageSize), 1);
  const safePage = Math.min(page, pageCount - 1);
  const visibleSplashes = splashes.slice(
    safePage * pageSize,
    (safePage + 1) * pageSize,
  );

  return (
    <Box>
      {visibleSplashes.length ? (
        <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} spacing="4">
          {visibleSplashes.map((splash) => (
            <TestSplashItem
              key={splash.id}
              splash={splash}
              isSelected={String(splash.id) === selectedSplashId}
              onSelect={() => onSelect(String(splash.id))}
            />
          ))}
        </SimpleGrid>
      ) : (
        <Alert status="info" borderRadius="xl">
          <AlertIcon />
          No splashes found.
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
