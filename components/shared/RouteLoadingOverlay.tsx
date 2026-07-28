import { Box, usePrefersReducedMotion } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import Loader from "./Loader";

const FADE_DURATION_MS = 200;
const SAFETY_TIMEOUT_MS = 10000;

export default function RouteLoadingOverlay() {
  const router = useRouter();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const safetyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearSafetyTimeout = () => {
      if (safetyTimeout.current) {
        clearTimeout(safetyTimeout.current);
        safetyTimeout.current = null;
      }
    };

    const show = () => {
      if (unmountTimeout.current) {
        clearTimeout(unmountTimeout.current);
        unmountTimeout.current = null;
      }
      setIsMounted(true);
      setIsVisible(true);
      clearSafetyTimeout();
      safetyTimeout.current = setTimeout(hide, SAFETY_TIMEOUT_MS);
    };

    const hide = () => {
      clearSafetyTimeout();
      setIsVisible(false);
      if (unmountTimeout.current) clearTimeout(unmountTimeout.current);
      unmountTimeout.current = setTimeout(() => {
        setIsMounted(false);
        unmountTimeout.current = null;
      }, FADE_DURATION_MS);
    };

    router.events.on("routeChangeStart", show);
    router.events.on("routeChangeComplete", hide);
    router.events.on("routeChangeError", hide);

    return () => {
      router.events.off("routeChangeStart", show);
      router.events.off("routeChangeComplete", hide);
      router.events.off("routeChangeError", hide);
      clearSafetyTimeout();
      if (unmountTimeout.current) clearTimeout(unmountTimeout.current);
    };
  }, [router.events]);

  if (!isMounted) return null;

  return (
    <Box
      position="fixed"
      inset="0"
      bg="rgba(0, 0, 0, 0.6)"
      zIndex="modal"
      display="flex"
      alignItems="center"
      justifyContent="center"
      opacity={isVisible ? 1 : 0}
      pointerEvents={isVisible ? "auto" : "none"}
      transition={
        prefersReducedMotion ? "none" : `opacity ${FADE_DURATION_MS}ms ease`
      }
    >
      <Loader size="xl" />
    </Box>
  );
}
