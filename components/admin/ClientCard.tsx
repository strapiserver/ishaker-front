import { Badge, Box, Flex, Grid, Heading, HStack, Text } from "@chakra-ui/react";
import { FiMapPin } from "react-icons/fi";
import type { Client } from "../../types/strapi";
import { ContactButton } from "./ContactButton";
import { MachineCard } from "./MachineCard";
import { getClientContacts, getClientLocation } from "./utils";

type ClientCardProps = {
  client: Client;
};

export function ClientCard({ client }: ClientCardProps) {
  const contacts = getClientContacts(client);
  const location = getClientLocation(client);

  return (
    <Box bg="bg.900" border="1px solid" borderColor="whiteAlpha.100" borderRadius="8px" overflow="hidden">
      <Flex
        p={{ base: 4, md: 5 }}
        align={{ base: "flex-start", md: "center" }}
        justify="space-between"
        gap={4}
        direction={{ base: "column", md: "row" }}
        borderBottom="1px solid"
        borderColor="whiteAlpha.100"
      >
        <Box>
          <HStack spacing={3} mb={2} align="center">
            <Heading as="h2" color="bg.50" fontSize={{ base: "22px", md: "28px" }} my={0}>
              {client.company}
            </Heading>
            <Badge bg="acid.300" color="bg.1000" borderRadius="6px" px={2}>
              client
            </Badge>
          </HStack>
          <HStack color="bg.300" spacing={2}>
            <FiMapPin />
            <Text>{location || "Location not set"}</Text>
          </HStack>
        </Box>

        <HStack spacing={2} flexWrap="wrap">
          {contacts.map((contact) => (
            <ContactButton key={`${contact.type}-${contact.label}`} contact={contact} />
          ))}
        </HStack>
      </Flex>

      <Box p={{ base: 4, md: 5 }}>
        {client.machines?.length ? (
          <Grid templateColumns={{ base: "1fr", xl: "repeat(2, minmax(0, 1fr))" }} gap={4}>
            {client.machines.map((machine) => (
              <MachineCard key={machine.id} machine={machine} />
            ))}
          </Grid>
        ) : (
          <Text color="bg.300">No machines assigned.</Text>
        )}
      </Box>
    </Box>
  );
}
