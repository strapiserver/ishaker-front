import { Box, Container, SimpleGrid, Text } from "@chakra-ui/react";
import { stats } from "./data";

type StatsSectionProps = {
  panelBg: string;
  borderColor: string;
  muted: string;
};

export function StatsSection({ panelBg, borderColor, muted }: StatsSectionProps) {
  return (
    <Box borderTop="1px solid" borderBottom="1px solid" borderColor={borderColor} bg={panelBg}>
      <Container maxW="7xl" py={{ base: "8", md: "10" }}>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing="4">
          {stats.map((item) => (
            <Box key={item.label} px="1">
              <Text fontSize="4xl" fontWeight="700" color="peach.300">
                {item.value}
              </Text>
              <Text color={muted}>{item.label}</Text>
            </Box>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}
