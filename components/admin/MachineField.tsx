import { Box, HStack, Link, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { displayValue } from "./utils";

type MachineFieldProps = {
  label: string;
  value?: string | null;
  href?: string;
  icon?: ReactNode;
};

export function MachineField({ label, value, href, icon }: MachineFieldProps) {
  const content = (
    <HStack spacing={2} color={href ? "acid.300" : "bg.100"} minW={0}>
      {icon}
      <Text fontWeight="700" noOfLines={1}>
        {displayValue(value)}
      </Text>
    </HStack>
  );

  return (
    <Box bg="bg.900" border="1px solid" borderColor="whiteAlpha.100" borderRadius="8px" p={3} minW={0}>
      <Text color="bg.400" fontSize="xs" fontWeight="800" textTransform="uppercase" mb={1}>
        {label}
      </Text>
      {href && value ? (
        <Link href={href} color="acid.300" _hover={{ color: "acid.200" }}>
          {content}
        </Link>
      ) : (
        content
      )}
    </Box>
  );
}
