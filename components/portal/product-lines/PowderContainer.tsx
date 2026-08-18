import { Box, Image, Text, Tooltip } from "@chakra-ui/react";
import type { KeyboardEvent, PointerEvent } from "react";

export type PowderContainerProps = {
  color?: string | null;
  height: number;
  maxWeightKg: number;
  onHeightChange: (height: number) => void;
  onHeightChangeEnd?: (height: number) => void;
  containerNumber: number;
  productName?: string;
  productImageUrl?: string;
  cupImageUrl?: string;
  cupCount?: number;
  isDisabled?: boolean;
};

export const CONTAINER_WIDTH = 200;
export const DEFAULT_POWDER_COLOR = "#d9b56d";
const CONTAINER_HEIGHT = 610;
// Reduce this value to let the powder fill reach higher inside the PNG.
const POWDER_START_Y = 10;
export const MAX_POWDER_HEIGHT = CONTAINER_HEIGHT - POWDER_START_Y;
// The visible color remains this tall even when the powder value is zero.
const MIN_POWDER_VISUAL_HEIGHT = 120;

export const resolvePowderColor = (value?: string | null) => {
  const color = value?.trim();
  if (!color || /^(transparent|none|initial|inherit|unset)$/i.test(color)) {
    return DEFAULT_POWDER_COLOR;
  }

  const shortHex = color.match(/^#([0-9a-f]{4})$/i)?.[1];
  const longHex = color.match(/^#([0-9a-f]{8})$/i)?.[1];
  if (shortHex?.endsWith("0") || longHex?.endsWith("00")) {
    return DEFAULT_POWDER_COLOR;
  }

  const opaqueHex = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1];
  if (opaqueHex) {
    const expanded =
      opaqueHex.length === 3
        ? opaqueHex
            .split("")
            .map((digit) => `${digit}${digit}`)
            .join("")
        : opaqueHex;
    const red = Number.parseInt(expanded.slice(0, 2), 16);
    const green = Number.parseInt(expanded.slice(2, 4), 16);
    const blue = Number.parseInt(expanded.slice(4, 6), 16);
    const perceivedBrightness =
      (red * 299 + green * 587 + blue * 114) / 1000;
    if (perceivedBrightness < 50) return DEFAULT_POWDER_COLOR;
  }

  if (
    /^(?:rgba|hsla)\([^)]*(?:,|\/)\s*(?:0(?:\.0+)?|0%)\s*\)$/i.test(
      color,
    )
  ) {
    return DEFAULT_POWDER_COLOR;
  }

  const isSupportedColor =
    /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(
      color,
    ) ||
    /^(?:rgb|rgba|hsl|hsla)\([^)]*\)$/i.test(color) ||
    /^[a-z]+$/i.test(color);

  return isSupportedColor ? color : DEFAULT_POWDER_COLOR;
};

export function PowderContainer({
  color,
  height,
  maxWeightKg,
  onHeightChange,
  onHeightChangeEnd,
  containerNumber,
  productName,
  productImageUrl,
  cupImageUrl,
  cupCount = 0,
  isDisabled = false,
}: PowderContainerProps) {
  const powderHeight = Math.min(
    MAX_POWDER_HEIGHT,
    Math.max(0, Math.round(height)),
  );
  const fillRatio = powderHeight / MAX_POWDER_HEIGHT;
  const visualPowderHeight =
    MIN_POWDER_VISUAL_HEIGHT +
    fillRatio * (MAX_POWDER_HEIGHT - MIN_POWDER_VISUAL_HEIGHT);
  const powderHeightPercent = isDisabled
    ? 0
    : (visualPowderHeight / CONTAINER_HEIGHT) * 100;
  const weight = fillRatio * maxWeightKg;
  const powderColor = resolvePowderColor(color);

  const getHeightFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const heightFromBottom = bounds.bottom - event.clientY;
    const visualHeight = (heightFromBottom / bounds.height) * CONTAINER_HEIGHT;
    const intrinsicHeight =
      ((visualHeight - MIN_POWDER_VISUAL_HEIGHT) /
        (MAX_POWDER_HEIGHT - MIN_POWDER_VISUAL_HEIGHT)) *
      MAX_POWDER_HEIGHT;

    return Math.min(MAX_POWDER_HEIGHT, Math.max(0, intrinsicHeight));
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (isDisabled) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    onHeightChange(getHeightFromPointer(event));
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (isDisabled) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      onHeightChange(getHeightFromPointer(event));
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (isDisabled) return;
    const nextHeight = getHeightFromPointer(event);
    onHeightChange(nextHeight);
    onHeightChangeEnd?.(nextHeight);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isDisabled) return;
    const step = MAX_POWDER_HEIGHT / 100;

    if (event.key === "ArrowUp" || event.key === "ArrowRight") {
      event.preventDefault();
      const nextHeight = Math.min(MAX_POWDER_HEIGHT, powderHeight + step);
      onHeightChange(nextHeight);
      onHeightChangeEnd?.(nextHeight);
    } else if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
      event.preventDefault();
      const nextHeight = Math.max(0, powderHeight - step);
      onHeightChange(nextHeight);
      onHeightChangeEnd?.(nextHeight);
    } else if (event.key === "Home") {
      event.preventDefault();
      onHeightChange(0);
      onHeightChangeEnd?.(0);
    } else if (event.key === "End") {
      event.preventDefault();
      onHeightChange(MAX_POWDER_HEIGHT);
      onHeightChangeEnd?.(MAX_POWDER_HEIGHT);
    }
  };

  return (
    <Tooltip
      label={
        isDisabled
          ? "Empty container"
          : `${productName ? `${productName} · ` : ""}${weight.toFixed(2)} kg${
              cupCount > 1 ? ` · ${cupCount} screen cups, one physical cup` : ""
            }`
      }
      hasArrow
      placement="top"
      openDelay={0}
    >
      <Box
        position="relative"
        flex="1 1 0"
        minW="0"
        maxW={`${CONTAINER_WIDTH}px`}
        maxH={`${CONTAINER_HEIGHT}px`}
        aspectRatio={`${CONTAINER_WIDTH} / ${CONTAINER_HEIGHT}`}
        overflow="hidden"
        cursor={isDisabled ? "not-allowed" : "grab"}
        sx={{ touchAction: "none" }}
        role="slider"
        tabIndex={isDisabled ? -1 : 0}
        aria-label="Powder weight"
        aria-valuemin={0}
        aria-valuemax={maxWeightKg}
        aria-valuenow={Number(weight.toFixed(2))}
        aria-valuetext={`${weight.toFixed(2)} kilograms`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onKeyDown={handleKeyDown}
        bg={isDisabled ? "bg.900" : "bg.700"}
        opacity={isDisabled ? 0.5 : 1}
        _active={{ cursor: isDisabled ? "not-allowed" : "grabbing" }}
        _focusVisible={{ outline: "2px solid", outlineColor: "blue.300" }}
      >
        <Box
          position="absolute"
          bottom="0"
          left="1%"
          w="98%"
          h={`${powderHeightPercent}%`}
          bg={powderColor}
          overflow="hidden"
          sx={{
            WebkitMaskImage: "url(/container.png)",
            maskImage: "url(/container.png)",
            WebkitMaskSize: "100% auto",
            maskSize: "100% auto",
            WebkitMaskPosition: "bottom center",
            maskPosition: "bottom center",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
          }}
          transition="height 100ms ease"
          _before={{
            content: '\"\"',
            position: "absolute",
            inset: "0",
            opacity: 0.42,
            backgroundImage:
              "radial-gradient(circle at 18% 22%, rgba(255,255,255,.55) 0 1px, transparent 1.5px), radial-gradient(circle at 72% 64%, rgba(0,0,0,.42) 0 1px, transparent 1.6px), radial-gradient(circle at 42% 78%, rgba(255,255,255,.32) 0 0.8px, transparent 1.4px)",
            backgroundSize: "9px 11px, 13px 15px, 7px 10px",
            mixBlendMode: "soft-light",
          }}
        />

        <Box
          aria-hidden="true"
          position="absolute"
          inset="0"
          zIndex="1"
          w="100%"
          h="100%"
          bgImage="url('/container.png')"
          bgPosition="center"
          bgRepeat="no-repeat"
          bgSize="100% 100%"
          opacity="1"
          filter={"grayscale(1) brightness(0.55)"}
          transition="filter 150ms ease"
          pointerEvents="none"
          userSelect="none"
        />

        <Text
          aria-hidden="true"
          position="absolute"
          top="5%"
          left="50%"
          zIndex="2"
          transform="translateX(-50%)"
          color="white"
          fontSize="clamp(10px, 1.2vw, 15px)"
          fontWeight="800"
          lineHeight="1"
          textShadow="0 1px 4px rgba(0, 0, 0, 0.9)"
          pointerEvents="none"
          userSelect="none"
        >
          {containerNumber}
        </Text>

        {productImageUrl ? (
          <Image
            src={productImageUrl}
            alt=""
            aria-hidden="true"
            position="absolute"
            top="13%"
            left="16%"
            zIndex="2"
            w="68%"
            h="31%"
            objectFit="contain"
            pointerEvents="none"
            userSelect="none"
          />
        ) : null}

        {cupImageUrl ? (
          <Box
            position="absolute"
            top="43%"
            left="50%"
            zIndex="2"
            transform="translateX(-50%)"
            w="68%"
            textAlign="center"
            pointerEvents="none"
          >
            <Image
              src={cupImageUrl}
              alt=""
              aria-hidden="true"
              mx="auto"
              w="68%"
              aspectRatio="1"
              objectFit="contain"
              filter="drop-shadow(0 2px 4px rgba(0,0,0,.65))"
            />
            {cupCount > 1 ? (
              <Text
                mt="-1"
                px="1"
                py="0.5"
                borderRadius="full"
                bg="blackAlpha.700"
                color="white"
                fontSize="clamp(7px, .75vw, 10px)"
                fontWeight="800"
                lineHeight="shorter"
                whiteSpace="nowrap"
              >
                1st cup +{cupCount - 1}
              </Text>
            ) : null}
          </Box>
        ) : null}
      </Box>
    </Tooltip>
  );
}
