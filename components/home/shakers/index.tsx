import { Box } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { SmokeBack } from "./SmokeBack";
import { SmokeFront } from "./SmokeFront";

export function SmokeScene() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isActive, setIsActive] = useState(false);

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
    <Box
      ref={rootRef}
      position="relative"
      isolation="isolate"
      mx="auto"
      my={{ base: "16", md: "100px" }}
      w={{ base: "min(96vw, 560px)", lg: "min(96vw, 900px)" }}
      maxW="100%"
      aspectRatio="1520 / 280"
      overflow="visible"
    >
      <SmokeBack isActive={isActive} />

      <Box
        as="img"
        src="/shakers.png"
        alt=""
        draggable={false}
        position="absolute"
        left="50%"
        top="50%"
        zIndex={1}
        w={{ base: "96%", md: "84%" }}
        maxW="840px"
        transform="translate(-50%, -50%)"
        objectFit="contain"
        pointerEvents="none"
      />

      <SmokeFront isActive={isActive} />
    </Box>
  );
}
