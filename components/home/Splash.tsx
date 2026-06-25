import { Box, Container } from "@chakra-ui/react";
import { useEffect, useState } from "react";

const SPLASH_FRAME_MS = 55;
const SPLASH_FADE_MS = 200;
const SPLASH_FADE_FRAME_COUNT = Math.ceil(SPLASH_FADE_MS / SPLASH_FRAME_MS);

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
  const [isFadeComplete, setIsFadeComplete] = useState(false);
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
      setIsFadeComplete(false);
    }
  }, [splashIndex, splashes.length]);

  useEffect(() => {
    if (!isActive) {
      setFrameIndex(0);
      setIsFading(false);
      setIsFadeComplete(false);
    }
  }, [isActive]);

  useEffect(() => {
    if (!isFading) {
      return undefined;
    }

    const fadeTimeout = window.setTimeout(() => {
      setIsFadeComplete(true);
    }, SPLASH_FADE_MS);

    return () => window.clearTimeout(fadeTimeout);
  }, [isFading]);

  useEffect(() => {
    if (!isActive || !activeSplash.length) {
      return undefined;
    }

    const frameTimeout = window.setTimeout(() => {
      if (frameIndex >= activeSplash.length - 1) {
        if (!isFadeComplete) {
          return;
        }

        setSplashIndex((current) => (current + 1) % splashes.length);
        setFrameIndex(0);
        setIsFading(false);
        setIsFadeComplete(false);
        return;
      }

      const nextFrame = frameIndex + 1;
      const fadeStartFrame = Math.max(
        activeSplash.length - SPLASH_FADE_FRAME_COUNT,
        0,
      );

      if (nextFrame >= fadeStartFrame) {
        setIsFading(true);
      }

      setFrameIndex(nextFrame);
    }, SPLASH_FRAME_MS);

    return () => window.clearTimeout(frameTimeout);
  }, [
    activeSplash.length,
    frameIndex,
    isActive,
    isFadeComplete,
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
