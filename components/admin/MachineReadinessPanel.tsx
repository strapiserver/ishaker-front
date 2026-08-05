import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Collapse,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import {
  formatReadinessAge,
  formatReadinessTimestamp,
  isReadinessStale,
  isReadinessVerdict,
  readinessVerdictMeta,
} from "../../lib/admin/readiness";
import type { MachineReadiness } from "../../types/strapi";

type MachineReadinessPanelProps = {
  readiness?: MachineReadiness | null;
  now?: number;
};

const Count = ({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) => (
  <HStack spacing="1">
    <Text color={`${color}.200`} fontSize="lg" fontWeight="900">
      {value}
    </Text>
    <Text color="bg.400" fontSize="xs" fontWeight="800">
      {label}
    </Text>
  </HStack>
);

export function MachineReadinessPanel({
  readiness,
  now = Date.now(),
}: MachineReadinessPanelProps) {
  const [warningsOpen, setWarningsOpen] = useState(false);

  if (!readiness || !isReadinessVerdict(readiness.verdict)) {
    return (
      <Box
        bg="bg.900"
        border="1px solid"
        borderColor="whiteAlpha.100"
        borderRadius="2xl"
        p={{ base: "5", md: "6" }}
      >
        <Text color="acid.300" fontWeight="800" mb="2">
          Shipping readiness
        </Text>
        <Badge colorScheme="gray" mb="3">
          Not checked
        </Badge>
        <Text color="bg.300">
          The unit shipping gate has not reported a result for this machine.
        </Text>
      </Box>
    );
  }

  const meta = readinessVerdictMeta[readiness.verdict];
  const failed = Array.isArray(readiness.failed) ? readiness.failed : [];
  const warned = Array.isArray(readiness.warned) ? readiness.warned : [];
  const stale = isReadinessStale(readiness, now);

  return (
    <Box
      bg="bg.900"
      border="1px solid"
      borderColor={stale ? "orange.700" : `${meta.colorScheme}.800`}
      borderRadius="2xl"
      p={{ base: "5", md: "6" }}
    >
      <HStack
        justify="space-between"
        align={{ base: "flex-start", md: "center" }}
        spacing="4"
        flexWrap="wrap"
        mb="5"
      >
        <Box>
          <Text color="acid.300" fontWeight="800" mb="2">
            Shipping readiness
          </Text>
          <Badge
            colorScheme={meta.colorScheme}
            fontSize={{ base: "md", md: "lg" }}
            px="3"
            py="1.5"
            opacity={stale ? 0.55 : 1}
          >
            {meta.label}
          </Badge>
          <Text color="bg.300" fontSize="sm" mt="2">
            Last check: {formatReadinessTimestamp(readiness.at)} ·{" "}
            {formatReadinessAge(readiness.at, now)}
          </Text>
        </Box>

        <HStack
          spacing={{ base: "4", md: "6" }}
          bg="whiteAlpha.50"
          borderRadius="xl"
          px="4"
          py="2"
        >
          <Count value={readiness.counts?.ok ?? 0} label="OK" color="green" />
          <Count
            value={readiness.counts?.warn ?? 0}
            label="WARN"
            color="yellow"
          />
          <Count value={readiness.counts?.fail ?? 0} label="FAIL" color="red" />
        </HStack>
      </HStack>

      {stale ? (
        <Alert status="warning" borderRadius="lg" mb="5">
          <AlertIcon />
          These readiness data are more than three hours old. The machine may
          be unreachable and this verdict must not be treated as current.
        </Alert>
      ) : null}

      <Box mb={warned.length ? "5" : "0"}>
        <Text color="bg.100" fontWeight="800" mb="3">
          Failed checks ({failed.length})
        </Text>
        {failed.length ? (
          <SimpleGrid columns={1} spacing="3">
            {failed.map((checkId) => (
              <Box
                key={checkId}
                bg="red.900"
                border="1px solid"
                borderColor="red.800"
                borderRadius="lg"
                p="4"
              >
                <Text
                  color="red.200"
                  fontFamily="mono"
                  fontSize="sm"
                  fontWeight="800"
                  mb="2"
                >
                  {checkId}
                </Text>
                <Text color="bg.100" whiteSpace="pre-wrap">
                  {readiness.detail?.[checkId] ||
                    "No remediation detail was included in this report."}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        ) : (
          <Text color="green.300" fontSize="sm">
            No failed checks were reported.
          </Text>
        )}
      </Box>

      {warned.length ? (
        <Box>
          <Button
            variant="ghost"
            size="sm"
            px="0"
            color="yellow.200"
            onClick={() => setWarningsOpen((open) => !open)}
            aria-expanded={warningsOpen}
          >
            {warningsOpen ? "Hide" : "Show"} warning checks ({warned.length})
          </Button>
          <Collapse in={warningsOpen} animateOpacity>
            <VStack align="stretch" spacing="2" pt="3">
              {warned.map((checkId) => (
                <Text
                  key={checkId}
                  color="yellow.100"
                  bg="whiteAlpha.50"
                  borderRadius="md"
                  fontFamily="mono"
                  fontSize="sm"
                  px="3"
                  py="2"
                >
                  {checkId}
                </Text>
              ))}
            </VStack>
          </Collapse>
        </Box>
      ) : null}
    </Box>
  );
}
