import { Box } from "@chakra-ui/react";
import { SmokeCloud } from "./SmokeCloud";

type SmokeFrontProps = {
  isActive: boolean;
};

export function SmokeFront({ isActive }: SmokeFrontProps) {
  return (
    <Box position="absolute" inset="0" zIndex={2} pointerEvents="none">
      <SmokeCloud
        src="/smoke2.png"
        direction="left"
        duration="7s"
        isActive={isActive}
        xOffsetBefore="-10%"
        xOffsetAfter="10%"
        yOffsetBefore="-30%"
        yOffsetAfter="-20%"
        scaleBefore={1.0}
        scaleAfter={1.8}
      />
      <SmokeCloud
        src="/smoke2.png"
        direction="right"
        duration="7s"
        isActive={isActive}
        isReversed
        xOffsetBefore="-20%"
        xOffsetAfter="-10%"
        yOffsetBefore="-30%"
        yOffsetAfter="-20%"
        scaleBefore={1}
        scaleAfter={1.8}
      />
    </Box>
  );
}
