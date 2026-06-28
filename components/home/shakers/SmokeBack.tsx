import { Box } from "@chakra-ui/react";
import { SmokeCloud } from "./SmokeCloud";

type SmokeBackProps = {
  isActive: boolean;
};

export function SmokeBack({ isActive }: SmokeBackProps) {
  return (
    <Box position="absolute" inset="0" zIndex={0} pointerEvents="none">
      <SmokeCloud
        src="/smoke1.png"
        direction="left"
        duration="4.2s"
        isActive={isActive}
        xOffsetBefore="0%"
        xOffsetAfter="10%"
        yOffsetBefore="-50%"
        yOffsetAfter="-60%"
        scaleBefore={1.2}
        scaleAfter={1.4}
      />
      <SmokeCloud
        src="/smoke1.png"
        direction="right"
        duration="4.2s"
        isActive={isActive}
        isReversed
        xOffsetBefore="-20%"
        xOffsetAfter="-10%"
        yOffsetBefore="-50%"
        yOffsetAfter="-60%"
        scaleBefore={1.2}
        scaleAfter={1.4}
      />
    </Box>
  );
}
