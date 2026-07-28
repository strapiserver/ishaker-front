import { Box, BoxProps } from "@chakra-ui/react";
import dynamic from "next/dynamic";

const DotLottieReact = dynamic(
  () =>
    import("@lottiefiles/dotlottie-react").then((mod) => mod.DotLottieReact),
  { ssr: false },
);

const sizeMap = {
  xs: 16,
  sm: 24,
  md: 32,
  lg: 48,
  xl: 72,
};

const LOTTIE_SCALE = 3;

type LoaderProps = Omit<BoxProps, "size"> & {
  size?: keyof typeof sizeMap | number;
};

export default function Loader({
  size = "md",
  ...boxProps
}: LoaderProps) {
  const pixels =
    (typeof size === "number" ? size : sizeMap[size]) * LOTTIE_SCALE;
  const boxSize = `${pixels}px`;

  return (
    <Box
      role="status"
      aria-label="Loading"
      boxSize={boxSize}
      flexShrink={0}
      {...boxProps}
    >
      <DotLottieReact
        src="/cup.lottie"
        autoplay
        loop
        style={{ width: boxSize, height: boxSize }}
      />
    </Box>
  );
}
