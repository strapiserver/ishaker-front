import { Box, Container, SimpleGrid, Stack } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { Courosel, type TasteSlide } from "./Courosel";
import CustomTitle from "./CutsomTitle";
import { useSplashAnimation } from "./Splash";

type CupsProps = {
  tastes?: TasteSlide[];
};

export function Cups({ tastes = [] }: CupsProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isActive, setIsActive] = useState(false);
  const splashes = tastes.map((taste) => taste.splashFrames);
  const { activeFrame, activeIndex, isFading } = useSplashAnimation(
    splashes,
    isActive,
  );

  useEffect(() => {
    const root = rootRef.current;

    if (!root) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsActive(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.35,
      },
    );

    observer.observe(root);

    return () => observer.disconnect();
  }, []);

  return (
    <Container maxW="7xl" py={{ base: "8", md: "12" }}>
      <SimpleGrid
        columns={{ base: 1, lg: 2 }}
        spacing={{ base: "4", lg: "6" }}
        alignItems="center"
      >
        <Stack
          spacing="4"
          maxW="md"
          mx={{ base: "auto", lg: "0" }}
          textAlign={{ base: "center", lg: "left" }}
          align={{ base: "center", lg: "flex-start" }}
        >
          <CustomTitle
            as="h2"
            title="20+ flavors"
            subtitle="Browse protein, BCAA, isotonic, and water mixes as the cups fill with each animated splash."
            mt="0"
            mb="0"
            textAlign={{ base: "center", lg: "left" }}
            fontSize={{ base: "3xl", md: "8xl" }}
            subtitleProps={{
              fontSize: { base: "md", md: "lg" },
              lineHeight: "1.8",
              mx: "0",
            }}
          />
        </Stack>

        <Stack
          spacing={{ base: "3", md: "4" }}
          align="center"
          justifySelf={{ base: "center", lg: "end" }}
          w="100%"
        >
          <Courosel activeIndex={activeIndex} tastes={tastes} />
          <Box
            ref={rootRef}
            aria-label="iShaker cups with animated splash"
            role="img"
            tabIndex={0}
            position="relative"
            w={{ base: "min(92vw, 520px)", md: "680px", lg: "800px" }}
            maxW="100%"
            aspectRatio="1622 / 864"
            filter={isActive ? "brightness(1)" : "brightness(0.5)"}
            transition="filter 0.5s ease-in, transform 0.5s ease-in"
          >
            <Box
              as="img"
              src="/layer1.png"
              alt=""
              draggable={false}
              position="absolute"
              inset="0"
              zIndex="1"
              w="100%"
              h="100%"
              objectFit="contain"
              pointerEvents="none"
            />

            {activeFrame ? (
              <Box
                as="img"
                src={activeFrame}
                alt=""
                draggable={false}
                position="absolute"
                zIndex="2"
                left="50%"
                top="-36%"
                w="34%"
                transform="translateX(-50%)"
                objectFit="contain"
                opacity={isFading ? 0 : 1}
                transition="opacity 0.2s ease"
                pointerEvents="none"
              />
            ) : null}

            <Box
              as="img"
              src="/layer3.png"
              alt=""
              draggable={false}
              position="absolute"
              inset="0"
              zIndex="3"
              w="100%"
              h="100%"
              objectFit="contain"
              pointerEvents="none"
            />
          </Box>
        </Stack>
      </SimpleGrid>
    </Container>
  );
}
