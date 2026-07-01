import { Box, Text } from "@chakra-ui/react";

type MetricProps = {
  label: string;
  value: string | number;
};

export function Metric({ label, value }: MetricProps) {
  return (
    <Box bg="bg.900" border="1px solid" borderColor="whiteAlpha.100" borderRadius="8px" p={4}>
      <Text color="bg.300" fontSize="sm" fontWeight="700">
        {label}
      </Text>
      <Text color="acid.300" fontSize="30px" fontWeight="900" lineHeight="1.1">
        {value}
      </Text>
    </Box>
  );
}
