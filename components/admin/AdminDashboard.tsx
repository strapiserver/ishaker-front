import { Box, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { NextSeo } from "next-seo";
import type { Client } from "../../types/strapi";
import { AdminHeader } from "./AdminHeader";
import { ClientCard } from "./ClientCard";
import { Metric } from "./Metric";

export type AdminDashboardProps = {
  clients: Client[];
  loadError?: string;
};

export function AdminDashboard({ clients, loadError }: AdminDashboardProps) {
  const machineCount = clients.reduce((sum, client) => sum + (client.machines?.length || 0), 0);

  return (
    <>
      <NextSeo title="Admin Dashboard" noindex nofollow />
      <Box minH="100vh" bg="bg.1000" color="bg.100">
        <AdminHeader />

        <Box maxW="1280px" mx="auto" px={{ base: 4, md: 8 }} py={{ base: 6, md: 8 }}>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
            <Metric label="Clients" value={clients.length} />
            <Metric label="Machines" value={machineCount} />
            <Metric label="Visible status" value="client" />
          </SimpleGrid>

          {loadError ? (
            <Box
              bg="rgba(154, 52, 18, 0.18)"
              border="1px solid"
              borderColor="orange.700"
              borderRadius="8px"
              p={4}
              mb={5}
            >
              <Text color="orange.200" fontWeight="800">
                Data loading failed
              </Text>
              <Text color="orange.200">{loadError}</Text>
            </Box>
          ) : null}

          <Stack spacing={5}>
            {clients.map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </Stack>
        </Box>
      </Box>
    </>
  );
}
