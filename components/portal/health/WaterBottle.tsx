import { Box, Text, Tooltip } from "@chakra-ui/react";
import type { KeyboardEvent, PointerEvent } from "react";

export const MAX_WATER_LITERS = 19;

const BOTTLE_WIDTH = 200;
const BOTTLE_HEIGHT = 360;
const WATER_TOP_Y = 108;
const WATER_BOTTOM_Y = 326;
const MAX_WATER_VISUAL_HEIGHT = BOTTLE_HEIGHT - WATER_TOP_Y;
const MIN_WATER_VISUAL_HEIGHT = BOTTLE_HEIGHT - WATER_BOTTOM_Y;
const WATER_STEP_LITERS = 0.5;

const clampAndRoundLiters = (liters: number) =>
  Math.min(
    MAX_WATER_LITERS,
    Math.max(0, Math.round(liters / WATER_STEP_LITERS) * WATER_STEP_LITERS),
  );

export function WaterBottle({
  liters,
  onChange,
}: {
  liters: number;
  onChange: (liters: number) => void;
}) {
  const amount = clampAndRoundLiters(liters);
  const fillRatio = amount / MAX_WATER_LITERS;
  const visualWaterHeight =
    MIN_WATER_VISUAL_HEIGHT +
    fillRatio * (MAX_WATER_VISUAL_HEIGHT - MIN_WATER_VISUAL_HEIGHT);
  const waterHeightPercent = (visualWaterHeight / BOTTLE_HEIGHT) * 100;

  const getLitersFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const heightFromBottom = bounds.bottom - event.clientY;
    const visualHeight = (heightFromBottom / bounds.height) * BOTTLE_HEIGHT;
    const ratio =
      (visualHeight - MIN_WATER_VISUAL_HEIGHT) /
      (MAX_WATER_VISUAL_HEIGHT - MIN_WATER_VISUAL_HEIGHT);
    return clampAndRoundLiters(ratio * MAX_WATER_LITERS);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    onChange(getLitersFromPointer(event));
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      onChange(getLitersFromPointer(event));
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    onChange(getLitersFromPointer(event));
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handlePointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    let nextAmount: number | null = null;

    if (event.key === "ArrowUp" || event.key === "ArrowRight") {
      nextAmount = amount + WATER_STEP_LITERS;
    } else if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
      nextAmount = amount - WATER_STEP_LITERS;
    } else if (event.key === "Home") {
      nextAmount = 0;
    } else if (event.key === "End") {
      nextAmount = MAX_WATER_LITERS;
    }

    if (nextAmount !== null) {
      event.preventDefault();
      onChange(clampAndRoundLiters(nextAmount));
    }
  };

  return (
    <Tooltip label={`${amount.toFixed(1)} L`} hasArrow placement="top">
      <Box
        position="relative"
        w={`min(100%, ${BOTTLE_WIDTH}px)`}
        aspectRatio={`${BOTTLE_WIDTH} / ${BOTTLE_HEIGHT}`}
        overflow="hidden"
        cursor="grab"
        sx={{ touchAction: "none" }}
        role="slider"
        tabIndex={0}
        aria-label="Water remaining in bottle"
        aria-valuemin={0}
        aria-valuemax={MAX_WATER_LITERS}
        aria-valuenow={amount}
        aria-valuetext={`${amount.toFixed(1)} liters`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onKeyDown={handleKeyDown}
        _active={{ cursor: "grabbing" }}
        _focusVisible={{ outline: "2px solid", outlineColor: "blue.300" }}
      >
        <Box
          aria-hidden="true"
          position="absolute"
          inset="0"
          zIndex="1"
          bgImage="url('/bottle.png')"
          bgPosition="center"
          bgRepeat="no-repeat"
          bgSize="100% 100%"
          filter="grayscale(1) brightness(.55)"
          pointerEvents="none"
          userSelect="none"
        />

        <Box
          aria-hidden="true"
          position="absolute"
          bottom="1"
          left="1%"
          w="98%"
          h={`${waterHeightPercent}%`}
          bg="blue.400"
          pointerEvents="none"
          sx={{
            WebkitMaskImage: "url(/bottle.png)",
            maskImage: "url(/bottle.png)",
            WebkitMaskSize: "100% auto",
            maskSize: "100% auto",
            WebkitMaskPosition: "bottom center",
            maskPosition: "bottom center",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
          }}
          transition="height 100ms ease"
        />

        <Text
          aria-hidden="true"
          position="absolute"
          left="50%"
          bottom="24%"
          zIndex="2"
          transform="translateX(-50%)"
          px="2"
          py="1"
          borderRadius="md"
          bg="blackAlpha.700"
          color="white"
          fontSize="sm"
          fontWeight="800"
          lineHeight="1"
          whiteSpace="nowrap"
          pointerEvents="none"
          userSelect="none"
        >
          {amount.toFixed(1)} L
        </Text>
      </Box>
    </Tooltip>
  );
}
