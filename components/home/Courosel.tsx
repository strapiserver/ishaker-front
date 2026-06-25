import { Box, Flex, useColorModeValue } from "@chakra-ui/react";
import { useEffect, useRef } from "react";

export type TasteSlide = {
  circleImage: string;
  name: string;
  mainImage: string;
  splashFrames: string[];
};

type CouroselProps = {
  activeIndex: number;
  tastes: TasteSlide[];
};

const slideFlex = { base: "0 0 42%", md: "0 0 34%" };

export function Courosel({ activeIndex, tastes }: CouroselProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const bg = useColorModeValue("bg.50", "bg.900");

  useEffect(() => {
    const activeSlide = slideRefs.current[activeIndex];

    activeSlide?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeIndex]);

  if (!tastes.length) {
    return null;
  }

  return (
    <Box
      aria-label="Taste image carousel"
      overflow="hidden"
      mx="auto"
      mt={{ base: "2", md: "3" }}
      position="relative"
      w={{ base: "min(92vw, 420px)", md: "520px", lg: "620px" }}
      py="2"
    >
      <Flex
        ref={scrollRef}
        gap={{ base: "3", md: "4" }}
        overflowX="hidden"
        scrollBehavior="smooth"
        scrollSnapType="x mandatory"
        sx={{
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
        }}
      >
        <Box
          aria-hidden="true"
          flex={slideFlex}
          aspectRatio="1"
          pointerEvents="none"
        />
        {tastes.map((taste, index) => {
          const isVisible = index === activeIndex;

          return (
          <Box
            key={taste.name}
            ref={(node) => {
              slideRefs.current[index] = node;
            }}
            aria-label={taste.name}
            role="img"
            flex={slideFlex}
            position="relative"
            aspectRatio="1"
            scrollSnapAlign="center"
          >
            <Box
              as="img"
              src={taste.circleImage}
              alt=""
              draggable={false}
              position="absolute"
              inset="-2%"
              zIndex="0"
              w="104%"
              h="104%"
              objectFit="contain"
              animation={isVisible ? "spin 1s linear infinite" : undefined}
              sx={{
                "@keyframes spin": {
                  "0%": { transform: "rotate(0deg)" },
                  "100%": { transform: "rotate(360deg)" },
                },
              }}
            />
            <Box
              as="img"
              src={taste.mainImage}
              alt=""
              draggable={false}
              position="relative"
              zIndex="1"
              w="100%"
              h="100%"
              objectFit="contain"
              filter={isVisible ? "brightness(1)" : "brightness(0.7)"}
              transform={isVisible ? "scale(1)" : "scale(0.8)"}
              transition="filter 0.2s ease, transform 0.2s ease"
            />
          </Box>
          );
        })}
        <Box
          aria-hidden="true"
          flex={slideFlex}
          aspectRatio="1"
          pointerEvents="none"
        />
      </Flex>
      <Box
        aria-hidden="true"
        position="absolute"
        insetY="0"
        left="0"
        zIndex="1"
        w={{ base: "18%", md: "20%" }}
        bgGradient={`linear(to-r, ${bg}, transparent)`}
        pointerEvents="none"
      />
      <Box
        aria-hidden="true"
        position="absolute"
        insetY="0"
        right="0"
        zIndex="1"
        w={{ base: "18%", md: "20%" }}
        bgGradient={`linear(to-l, ${bg}, transparent)`}
        pointerEvents="none"
      />
    </Box>
  );
}
