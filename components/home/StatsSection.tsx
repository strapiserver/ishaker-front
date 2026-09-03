import { Box, Container, SimpleGrid, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { stats } from "./data";

type StatsSectionProps = {
  panelBg: string;
  borderColor: string;
  muted: string;
};

export function StatsSection({
  panelBg,
  borderColor,
  muted,
}: StatsSectionProps) {
  const [drinksMade, setDrinksMade] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/public/fleet-stats", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        const cups = Number(payload?.totals?.cups_total);
        if (Number.isFinite(cups)) {
          setDrinksMade(new Intl.NumberFormat("en-US").format(cups));
        }
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  return (
    <Box
      borderTop="1px solid"
      borderBottom="1px solid"
      borderColor={borderColor}
      bg={panelBg}
    >
      <Container maxW="7xl" py={{ base: "8", md: "10" }}>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing="4">
          {stats.map((item) => (
            <Box key={item.label} px="1">
              <Text fontSize="4xl" fontWeight="700" color="acid.300">
                {item.label === "Drinks made" && drinksMade
                  ? drinksMade
                  : item.value}
              </Text>
              <Text color={muted}>{item.label}</Text>
            </Box>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}
