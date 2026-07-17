import {
  Box,
  SimpleGrid,
  VStack,
  Stat,
  StatLabel,
  StatNumber,
  Text,
} from "@chakra-ui/react";
import type { GetServerSideProps } from "next";
import { PortalShell } from "../components/portal/PortalShell";
import { requirePortalSession } from "../lib/portal/auth";
import type { PortalSession } from "../types/portal";

type SalesPageProps = {
  session: PortalSession;
};

export default function SalesPage({ session }: SalesPageProps) {
  return (
    <PortalShell
      title="Sales"
      description="Your sales will be displayed here once the telemetry integration is complete."
      clientName={session.client.company}
    >
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing="5" mb="6">
        <Box
          bg="bg.900"
          border="1px solid"
          borderColor="whiteAlpha.100"
          borderRadius="2xl"
          p="6"
        >
          <Stat>
            <StatLabel color="bg.300">Revenue</StatLabel>
            <StatNumber color="bg.50">$0.00</StatNumber>
          </Stat>
        </Box>
        <Box
          bg="bg.900"
          border="1px solid"
          borderColor="whiteAlpha.100"
          borderRadius="2xl"
          p="6"
        >
          <Stat>
            <StatLabel color="bg.300">Sales count</StatLabel>
            <StatNumber color="bg.50">0</StatNumber>
          </Stat>
        </Box>
        <Box
          bg="bg.900"
          border="1px solid"
          borderColor="whiteAlpha.100"
          borderRadius="2xl"
          p="6"
        >
          <Stat>
            <StatLabel color="bg.300">Machines in scope</StatLabel>
            <StatNumber color="bg.50">{session.machines.length}</StatNumber>
          </Stat>
        </Box>
      </SimpleGrid>

      <Box
        bg="bg.900"
        border="1px solid"
        borderColor="whiteAlpha.100"
        borderRadius="2xl"
        p="6"
      >
        <VStack spacing="3" align="stretch">
          <Text color="acid.300" fontWeight="800">
            Telemetry sales integration pending
          </Text>
          <Text color="bg.300">
            To finish this page, I need the exact endpoint mappings used by the
            existing Python telemetry client for `get_sales`, `get_sales_stats`,
            and `get_sales_qty`.
          </Text>
        </VStack>
      </Box>
    </PortalShell>
  );
}

export const getServerSideProps: GetServerSideProps<SalesPageProps> = async (
  context,
) => {
  const result = await requirePortalSession(context);
  if ("redirect" in result) return { redirect: result.redirect };

  return {
    props: {
      session: result.session,
    },
  };
};
