import { Box, BoxProps } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { SmokeBack } from "./SmokeBack";
import { SmokeFront } from "./SmokeFront";

type SmokeSceneProps = BoxProps;

export function SmokeScene(props: SmokeSceneProps) {
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
      mt={{ base: "0", lg: "10" }}
      mb="0"
      order={{ base: 1, lg: 2 }}
      justifySelf={{ base: "center", lg: "end" }}
      w={{
        base: "min(96vw, 560px)",
        md: "min(88vw, 760px)",
        lg: "min(45vw, 784px)",
      }}
      maxW={{ base: "100%", lg: "none" }}
      aspectRatio="1520 / 280"
      overflow="visible"
      {...props}
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
        w={{ base: "96%", md: "90%", lg: "92%" }}
        maxW={{ base: "840px", lg: "728px" }}
        transform="translate(-50%, -50%)"
        objectFit="contain"
        pointerEvents="none"
      />

      <SmokeFront isActive={isActive} />
    </Box>
  );
}
