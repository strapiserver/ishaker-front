import { Box } from "@chakra-ui/react";

type SmokeDirection = "left" | "right";

type SmokeCloudProps = {
  direction: SmokeDirection;
  duration: string;
  isActive: boolean;
  isReversed?: boolean;
  scaleBefore?: number;
  scaleAfter?: number;
  src: string;
  xOffset?: string;
  xOffsetBefore?: string;
  xOffsetAfter?: string;
  yOffset?: string;
  yOffsetBefore?: string;
  yOffsetAfter?: string;
};

function getDirectionalXOffset(
  direction: SmokeDirection,
  rightXOffset: string,
) {
  if (direction === "right") {
    return rightXOffset;
  }

  return `${-100 - Number.parseFloat(rightXOffset)}%`;
}

export function SmokeCloud({
  direction,
  duration,
  isActive,
  isReversed = false,
  scaleBefore = 1.2,
  scaleAfter = 1.5,
  src,
  xOffset,
  xOffsetBefore = "-50%",
  xOffsetAfter = xOffset ?? "-50%",
  yOffset,
  yOffsetBefore = "-50%",
  yOffsetAfter = yOffset ?? "-50%",
}: SmokeCloudProps) {
  const xOffsetValue = isActive ? xOffsetAfter : xOffsetBefore;
  const yOffsetValue = isActive ? yOffsetAfter : yOffsetBefore;
  const directionalXOffset = getDirectionalXOffset(direction, xOffsetValue);
  const animatedScale = isActive ? scaleAfter : scaleBefore;
  const scale = isReversed ? -animatedScale : animatedScale;
  const transform = `translate(${directionalXOffset}, ${yOffsetValue}) scale(${scale})`;

  return (
    <Box
      as="img"
      src={src}
      alt=""
      draggable={false}
      position="absolute"
      left="50%"
      top="50%"
      w="75%"
      h="150%"
      objectFit="contain"
      opacity={0.3}
      transform={transform}
      transition={`transform ${duration} ease-out`}
      pointerEvents="none"
    />
  );
}
