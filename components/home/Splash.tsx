import { Box, Container } from "@chakra-ui/react";
import { useEffect, useState } from "react";

export const SPLASH_FRAME_MS = 66;
export const SPLASH_LAST_FRAME_MS = 3000;
export const SPLASH_FADE_MS = 500;

type SplashProps = {
  splashes?: string[][];
  label?: string;
};

type SplashAnimation = {
  activeFrame?: string;
  activeIndex: number;
  isFading: boolean;
};

export function useSplashAnimation(
  splashes: string[][] = [],
  isActive: boolean,
): SplashAnimation {
  const [isFading, setIsFading] = useState(false);
  const [splashIndex, setSplashIndex] = useState(0);
  const [frameIndex, setFrameIndex] = useState(0);
  const activeSplash = splashes[splashIndex] ?? [];
  const activeFrame = activeSplash[frameIndex] ?? activeSplash[0];

  useEffect(() => {
    splashes.flat().forEach((frame) => {
      const image = new window.Image();
      image.src = frame;
    });
  }, [splashes]);

  useEffect(() => {
    if (splashIndex >= splashes.length) {
      setSplashIndex(0);
      setFrameIndex(0);
      setIsFading(false);
    }
  }, [splashIndex, splashes.length]);

  useEffect(() => {
    if (!isActive) {
      setFrameIndex(0);
      setIsFading(false);
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive || !activeSplash.length) {
      return undefined;
    }

    const isLastFrame = frameIndex >= activeSplash.length - 1;
    if (isLastFrame) {
      const fadeTimeout = window.setTimeout(() => {
        setIsFading(true);
      }, SPLASH_LAST_FRAME_MS - SPLASH_FADE_MS);
      const repeatTimeout = window.setTimeout(() => {
        setSplashIndex((current) => (current + 1) % splashes.length);
        setFrameIndex(0);
        setIsFading(false);
      }, SPLASH_LAST_FRAME_MS);

      return () => {
        window.clearTimeout(fadeTimeout);
        window.clearTimeout(repeatTimeout);
      };
    }

    const frameTimeout = window.setTimeout(() => {
      setFrameIndex((current) => current + 1);
    }, SPLASH_FRAME_MS);

    return () => window.clearTimeout(frameTimeout);
  }, [
    activeSplash.length,
    frameIndex,
    isActive,
    splashes.length,
  ]);

  return { activeFrame, activeIndex: splashIndex, isFading };
}

export function Splash({ splashes = [], label = "Flavor splash" }: SplashProps) {
  const [isHovering, setIsHovering] = useState(false);
  const { activeFrame, isFading } = useSplashAnimation(splashes, isHovering);

  if (!activeFrame) {
    return null;
  }

  return (
    <Container maxW="7xl" py={{ base: "2", md: "4" }}>
      <Box
        aria-label={label}
        role="img"
        tabIndex={0}
        position="relative"
        mx="auto"
        w={{ base: "min(70vw, 220px)", md: "280px", lg: "320px" }}
        aspectRatio="619 / 617"
        cursor="pointer"
        onMouseEnter={() => {
          setIsHovering(true);
        }}
        onMouseLeave={() => {
          setIsHovering(false);
        }}
        onFocus={() => {
          setIsHovering(true);
        }}
        onBlur={() => {
          setIsHovering(false);
        }}
      >
        <Box
          as="img"
          src={activeFrame}
          alt=""
          draggable={false}
          position="absolute"
          inset="0"
          w="100%"
          h="100%"
          objectFit="contain"
          filter="drop-shadow(0 18px 34px rgba(0, 0, 0, 0.16))"
          opacity={isFading ? 0 : 1}
          transition={`opacity ${SPLASH_FADE_MS / 1000}s ease`}
        />
      </Box>
    </Container>
  );
}
