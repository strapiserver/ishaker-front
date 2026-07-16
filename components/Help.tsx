import { IconButton, Tooltip } from "@chakra-ui/react";
import { FiHelpCircle } from "react-icons/fi";

export type HelpProps = {
  text: string;
};

export function Help({ text }: HelpProps) {
  return (
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
  );
}
