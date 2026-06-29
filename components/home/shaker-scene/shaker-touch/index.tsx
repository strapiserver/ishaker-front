import {
  Box,
  BoxProps,
  Button,
  Divider,
  Flex,
  ResponsiveValue,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaArrowRight } from "react-icons/fa";

type ShakerTouchProps = BoxProps & {
  videoBottom?: BoxProps["bottom"];
  videoSize?: ResponsiveValue<string | number>;
  videoTop?: BoxProps["top"];
};

export function ShakerTouch({
  videoBottom,
  videoSize = "100%",
  videoTop,
  ...props
}: ShakerTouchProps) {
  const titleColor = useColorModeValue("bg.1000", "bg.50");
  const textColor = useColorModeValue("bg.600", "bg.300");
  const specColor = useColorModeValue("green.700", "green.200");
  const ruleColor = useColorModeValue("blackAlpha.200", "whiteAlpha.300");
  const dividerColor = useColorModeValue("blackAlpha.200", "whiteAlpha.200");

  return (
    <Box
      position="relative"
      isolation="isolate"
      display={{ base: "flex", lg: "block" }}
      flexDirection="column"
      w={{ base: "min(72vw, 280px)", md: "320px", lg: "380px" }}
      overflow="visible"
      {...props}
    >
      <Stack
        spacing="3"
        position={{ base: "static", lg: "absolute" }}
        left={{ lg: "calc(100% + 28px)" }}
        top={{ lg: "22%" }}
        w={{ base: "100%", lg: "260px" }}
        order={{ base: 2, lg: 0 }}
        mt={{ base: "4", lg: "0" }}
        textAlign={{ base: "center", lg: "left" }}
        align={{ base: "center", lg: "flex-start" }}
      >
        <Text
          color={titleColor}
          fontSize={{ base: "xl", md: "2xl" }}
          fontWeight="800"
          lineHeight="1.05"
        >
          iShaker Touch
        </Text>
        <Text
          color={textColor}
          fontSize={{ base: "sm", md: "md" }}
          lineHeight="1.7"
        >
          Touch-screen shake vending with a polished self-service flow and
          remote operations.
        </Text>
        <Flex
          gap="2"
          wrap="wrap"
          justify={{ base: "center", lg: "flex-start" }}
          color={specColor}
          fontSize="xs"
          fontWeight="700"
          textTransform="uppercase"
        >
          <Text>Touch UI</Text>
          <Text color={ruleColor}>/</Text>
          <Text>Card reader ready</Text>
          <Text color={ruleColor}>/</Text>
          <Text>24/7 support</Text>
        </Flex>
        <Divider borderColor={dividerColor} />
        <Flex
          align="center"
          gap="4"
          justify={{ base: "center", lg: "flex-start" }}
          wrap="wrap"
        >
          <Stack spacing="0" align={{ base: "center", lg: "flex-start" }}>
            <Text
              color={textColor}
              fontSize="xs"
              fontWeight="700"
              textTransform="uppercase"
            >
              Starting at
            </Text>
            <Text
              color={titleColor}
              fontSize={{ base: "2xl", md: "3xl" }}
              fontWeight="900"
              lineHeight="1"
            >
              $9,900
            </Text>
          </Stack>
          <Button
            as="a"
            href="/step1"
            variant="primary"
            size="sm"
            rightIcon={<FaArrowRight />}
          >
            See more
          </Button>
        </Flex>
      </Stack>

      <Box
        position="relative"
        order={{ base: 1, lg: 0 }}
        w="100%"
        aspectRatio="530 / 980"
        overflow="visible"
        ml={{ base: "-20px", lg: "0" }}
      >
        <Box
          as="video"
          src="/shaker-touch/240_shaker_touch.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          position="absolute"
          left="8%"
          right="0"
          top={videoTop ?? "0"}
          bottom={videoBottom ?? "0"}
          zIndex={1}
          w={videoSize}
          h={videoSize}
          m="auto"
          objectFit="contain"
          pointerEvents="none"
        />

        <Box
          as="img"
          src="/shaker-touch/shaker-touch.png"
          alt=""
          draggable={false}
          position="absolute"
          inset="0"
          zIndex={2}
          w="100%"
          h="100%"
          objectFit="contain"
          pointerEvents="none"
        />
      </Box>
    </Box>
  );
}
