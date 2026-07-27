import {
  Box,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  Portal,
  Tooltip,
} from "@chakra-ui/react";
import { FiHelpCircle } from "react-icons/fi";

export type HelpProps = {
  text: string;
};

export function Help({ text }: HelpProps) {
  return (
    <>
      <Box display={{ base: "none", md: "inline-flex" }}>
        <Tooltip
          label={text}
          hasArrow
          placement="top"
          openDelay={200}
          maxW="360px"
          px="3"
          py="2"
          lineHeight="1.45"
        >
          <IconButton
            type="button"
            aria-label={`Help: ${text}`}
            icon={<FiHelpCircle />}
            variant="ghost"
            size="xs"
            color="bg.400"
            _hover={{ color: "bg.100", bg: "whiteAlpha.100" }}
          />
        </Tooltip>
      </Box>

      <Box display={{ base: "inline-flex", md: "none" }}>
        <Popover placement="top" isLazy closeOnBlur>
          <PopoverTrigger>
            <IconButton
              type="button"
              aria-label={`Help: ${text}`}
              icon={<FiHelpCircle />}
              variant="ghost"
              size="sm"
              minW="44px"
              minH="44px"
              color="bg.300"
              _active={{ color: "bg.50", bg: "whiteAlpha.200" }}
            />
          </PopoverTrigger>
          <Portal>
            <PopoverContent
              maxW="calc(100vw - 2rem)"
              bg="bg.800"
              borderColor="whiteAlpha.300"
              color="bg.50"
              boxShadow="xl"
              _focusVisible={{ outline: "none" }}
            >
              <PopoverArrow bg="bg.800" />
              <PopoverCloseButton />
              <PopoverBody pr="10" py="3" lineHeight="1.45">
                {text}
              </PopoverBody>
            </PopoverContent>
          </Portal>
        </Popover>
      </Box>
    </>
  );
}
