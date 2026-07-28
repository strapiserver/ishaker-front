import {
  Box,
  Container,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useColorModeValue,
} from "@chakra-ui/react";
import CustomTitle from "../home/CutsomTitle";
import type { Characteristic } from "./types";

type ProductCharacteristicsProps = {
  characteristics: Characteristic[];
};

export function ProductCharacteristics({
  characteristics,
}: ProductCharacteristicsProps) {
  const pageBg = useColorModeValue("bg.50", "bg.900");
  const sectionBg = useColorModeValue("bg.10", "bg.800");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.100");
  const muted = useColorModeValue("bg.600", "bg.300");

  return (
    <Box
      as="section"
      bg={sectionBg}
      borderY="1px solid"
      borderColor={borderColor}
    >
      <Container maxW="7xl" py={{ base: "10", md: "14" }}>
        <CustomTitle
          as="h2"
          title="Characteristics"
          subtitle="Core machine details for planning placement, operations, and daily service."
          mt="0"
          mb={{ base: "6", md: "8" }}
          fontSize={{ base: "3xl", md: "5xl" }}
          subtitleProps={{
            fontSize: { base: "md", md: "lg" },
            lineHeight: "1.7",
          }}
        />

        <TableContainer
          border="1px solid"
          borderColor={borderColor}
          borderRadius="md"
          bg={pageBg}
        >
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Parameter</Th>
                <Th>Value</Th>
              </Tr>
            </Thead>
            <Tbody>
              {characteristics.map((item) => (
                <Tr key={item.label}>
                  <Td fontWeight="semibold">{item.label}</Td>
                  <Td color={muted}>{item.value}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </Container>
    </Box>
  );
}
