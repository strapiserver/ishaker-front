import { Flex, FlexProps } from "@chakra-ui/react";
import { ShakerS } from "./shaker-s";
import { ShakerTouch } from "./shaker-touch";

type ShakerSceneProps = FlexProps;

export function ShakerScene(props: ShakerSceneProps) {
  return (
    <Flex
      justify="center"
      align="flex-start"
      direction={{ base: "column", md: "row" }}
      gap={{ base: "4", md: "8", lg: "12" }}
      mt={{ base: "8", md: "12" }}
      mb="15"
      px="4"
      py={{ base: "8", md: "10" }}
      bg="radial-gradient(ellipse 84% 48% at center, rgba(18, 86, 52, 0.24) 0%, rgba(9, 50, 32, 0.15) 42%, transparent 76%)"
      {...props}
    >
      <ShakerS
        alignSelf="center"
        w={{ base: "min(82vw, 320px)", md: "300px", lg: "360px" }}
        videoTop={{ base: "86px", md: "86px", lg: "100px" }}
        videoSize="46%"
      />
      <ShakerTouch
        alignSelf="center"
        w={{ base: "min(82vw, 320px)", md: "300px", lg: "360px" }}
        videoTop={{ base: "-230px", md: "-220px", lg: "-250px" }}
        videoSize="46%"
      />
    </Flex>
  );
}
