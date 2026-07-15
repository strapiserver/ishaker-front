import {
  Box,
  BoxProps,
  Button,
  Divider,
  Flex,
  ResponsiveValue,
  VStack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaArrowRight } from "react-icons/fa";

type ShakerSProps = BoxProps & {
  videoBottom?: BoxProps["bottom"];
  videoSize?: ResponsiveValue<string | number>;
  videoTop?: BoxProps["top"];
};

export function ShakerS({
  videoBottom,
  videoSize = "100%",
  videoTop,
  ...props
}: ShakerSProps) {
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
      mt={{ base: "-250px", lg: "0" }}
      mb={{ base: "100px", lg: "0" }}
    >
      <VStack
        spacing="3"
        position={{ base: "static", lg: "absolute" }}
        right={{ lg: "calc(100% + 28px)" }}
        top={{ lg: "22%" }}
        w={{ base: "100%", lg: "260px" }}
        order={{ base: 2, lg: 0 }}
        mt={{ base: "4", lg: "0" }}
        textAlign={{ base: "center", lg: "right" }}
        align={{ base: "center", lg: "flex-end" }}
      >
        <Text
          color={titleColor}
          fontSize={{ base: "xl", md: "2xl" }}
          fontWeight="800"
          lineHeight="1.05"
        >
          iShaker S
        </Text>
        <Text
          color={textColor}
          fontSize={{ base: "sm", md: "md" }}
          lineHeight="1.7"
        >
          Compact automated shake service for gyms, offices, and boutique
          wellness spaces.
        </Text>
        <Flex
          gap="2"
          wrap="wrap"
          justify={{ base: "center", lg: "flex-end" }}
          color={specColor}
          fontSize="xs"
          fontWeight="700"
          textTransform="uppercase"
        >
          <Text>240 cups</Text>
          <Text color={ruleColor}>/</Text>
          <Text>6 blends</Text>
          <Text color={ruleColor}>/</Text>
          <Text>Cloud managed</Text>
        </Flex>
        <Divider borderColor={dividerColor} />
        <Flex
          align="center"
          gap="4"
          justify={{ base: "center", lg: "flex-end" }}
          wrap="wrap"
        >
          <VStack spacing="0" align={{ base: "center", lg: "flex-end" }}>
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
              $4,900
            </Text>
          </VStack>
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
      </VStack>
      <Box
        position="relative"
        order={{ base: 1, lg: 0 }}
        w="100%"
        aspectRatio="530 / 980"
        overflow="visible"
      >
        <Box
          as="video"
          src="/shaker-s/240_shaker_s.MP4"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          position="absolute"
          left="0"
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
          src="/shaker-s/shaker-s.png"
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
