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
        duration="3.4s"
        isActive={isActive}
        xOffsetBefore="-10%"
        xOffsetAfter="10%"
        yOffsetBefore="-30%"
        yOffsetAfter="-40%"
        scaleBefore={1.2}
        scaleAfter={1.4}
      />
      <SmokeCloud
        src="/smoke2.png"
        direction="right"
        duration="3.4s"
        isActive={isActive}
        isReversed
        xOffsetBefore="-20%"
        xOffsetAfter="-10%"
        yOffsetBefore="-30%"
        yOffsetAfter="-40%"
        scaleBefore={1.2}
        scaleAfter={1.4}
      />
    </Box>
  );
}
