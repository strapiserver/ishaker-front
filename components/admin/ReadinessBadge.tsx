import { Badge, Box, HStack, Text, Tooltip, VStack } from "@chakra-ui/react";
import {
  formatReadinessAge,
  formatReadinessTimestamp,
  isReadinessStale,
  isReadinessVerdict,
  readinessVerdictMeta,
} from "../../lib/admin/readiness";
import type { MachineReadiness } from "../../types/strapi";

type ReadinessBadgeProps = {
  readiness?: MachineReadiness | null;
  now?: number;
};

export function ReadinessBadge({
  readiness,
  now = Date.now(),
}: ReadinessBadgeProps) {
  if (!readiness || !isReadinessVerdict(readiness.verdict)) {
    return (
      <Tooltip
        label="The unit shipping gate has not reported a result for this machine. Do not treat an unchecked machine as ready to ship."
        hasArrow
        maxW="420px"
        p="3"
      >
        <HStack spacing="2" flexWrap="wrap" cursor="help">
          <Badge colorScheme="gray">Not checked</Badge>
          <Text color="bg.500" fontSize="xs">
            Shipping gate has not run
          </Text>
        </HStack>
      </Tooltip>
    );
  }

  const meta = readinessVerdictMeta[readiness.verdict];
  const stale = isReadinessStale(readiness, now);
  const failed = Array.isArray(readiness.failed) ? readiness.failed : [];
  const warned = Array.isArray(readiness.warned) ? readiness.warned : [];

  const explanation = (
    <VStack align="stretch" spacing="3">
      <Box>
        <Text fontWeight="900">{meta.label}</Text>
        <Text>{meta.description}</Text>
        <Text mt="1" opacity={0.8}>
          {formatReadinessTimestamp(readiness.at)} ·{" "}
          {formatReadinessAge(readiness.at, now)}
        </Text>
        <Text mt="1" fontWeight="700">
          {readiness.counts?.ok ?? 0} OK / {readiness.counts?.warn ?? 0} WARN
          {" / "}
          {readiness.counts?.fail ?? 0} FAIL
        </Text>
      </Box>

      {stale ? (
        <Text color="orange.200" fontWeight="800">
          Data are more than three hours old. The machine may be unreachable,
          so this verdict must not be treated as current.
        </Text>
      ) : null}

      {failed.length ? (
        <Box>
          <Text color="red.200" fontWeight="900" mb="1">
            Failed checks
          </Text>
          <VStack align="stretch" spacing="2">
            {failed.map((checkId) => (
              <Box key={checkId}>
                <Text fontFamily="mono" fontWeight="800">
                  {checkId}
                </Text>
                <Text whiteSpace="pre-wrap">
                  {readiness.detail?.[checkId] ||
                    "No remediation detail was included in this report."}
                </Text>
              </Box>
            ))}
          </VStack>
        </Box>
      ) : null}

      {warned.length ? (
        <Box>
          <Text color="yellow.200" fontWeight="900" mb="1">
            Warning checks
          </Text>
          <Text fontFamily="mono">{warned.join(", ")}</Text>
        </Box>
      ) : null}
    </VStack>
  );

  return (
    <Tooltip
      label={explanation}
      hasArrow
      placement="top"
      maxW="560px"
      p="4"
      openDelay={100}
    >
      <HStack spacing="2" flexWrap="wrap" cursor="help">
        <Badge colorScheme={meta.colorScheme} opacity={stale ? 0.55 : 1}>
          {meta.label}
        </Badge>
        <Text color={stale ? "bg.500" : "bg.400"} fontSize="xs">
          {formatReadinessAge(readiness.at, now)}
        </Text>
        {stale ? (
          <Badge colorScheme="orange" variant="outline">
            Stale data
          </Badge>
        ) : null}
      </HStack>
    </Tooltip>
  );
}
