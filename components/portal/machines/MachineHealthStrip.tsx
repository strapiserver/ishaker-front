import {
  Badge,
  Box,
  HStack,
  Icon,
  SimpleGrid,
  Skeleton,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import type { IconType } from "react-icons";
import {
  FaBoxOpen,
  FaCreditCard,
  FaTint,
  FaWifi,
  FaWineGlass,
} from "react-icons/fa";
import type {
  HealthState,
  MachineHealthIndicator,
  MachineHealthRow,
} from "../../../types/machineHealth";

type MachineHealthStripProps = {
  health?: MachineHealthRow;
  isLoading?: boolean;
};

const stateColor: Record<HealthState, string> = {
  ok: "green",
  warning: "yellow",
  error: "red",
  unknown: "gray",
};

const ageLabel = (at?: string | null) => {
  if (!at) return "Report time unavailable";
  const timestamp = Date.parse(at);
  if (Number.isNaN(timestamp)) return "Report time unavailable";
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60_000));
  if (minutes < 1) return "Reported just now";
  if (minutes < 60) return `Reported ${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `Reported ${hours}h ago`;
};

const HealthItem = ({
  title,
  icon,
  indicator,
}: {
  title: string;
  icon: IconType;
  indicator: MachineHealthIndicator;
}) => {
  const color = stateColor[indicator.state];
  const tooltip = `${title}: ${indicator.label}. Source: ${indicator.source}. ${ageLabel(indicator.at)}`;

  return (
    <Tooltip label={tooltip} hasArrow>
      <VStack
        spacing="1"
        minW="0"
        py="2"
        px="1"
        borderRadius="lg"
        bg="whiteAlpha.50"
      >
        <HStack spacing="1.5" minW="0">
          <Box
            display="grid"
            placeItems="center"
            boxSize="7"
            flex="0 0 auto"
            borderRadius="full"
            bg={`${color}.900`}
            color={`${color}.200`}
          >
            <Icon as={icon} boxSize="3.5" />
          </Box>
          <Box minW="0">
            <Text color="bg.400" fontSize="9px" lineHeight="1" noOfLines={1}>
              {title}
            </Text>
            <Text color="bg.50" fontSize="xs" fontWeight="700" noOfLines={1}>
              {indicator.label}
            </Text>
          </Box>
        </HStack>
        {indicator.source !== "ops" && indicator.source !== "own" ? (
          <Badge colorScheme={color} fontSize="8px" lineHeight="14px">
            {indicator.source}
          </Badge>
        ) : null}
      </VStack>
    </Tooltip>
  );
};

const noData: MachineHealthIndicator = {
  state: "unknown",
  label: "No data",
  source: "none",
};

export function MachineHealthStrip({
  health,
  isLoading = false,
}: MachineHealthStripProps) {
  if (isLoading) {
    return (
      <SimpleGrid columns={5} spacing="2" aria-label="Loading machine health">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} h="58px" borderRadius="lg" />
        ))}
      </SimpleGrid>
    );
  }

  const items = [
    { title: "Online", icon: FaWifi, indicator: health?.online || noData },
    { title: "Nayax", icon: FaCreditCard, indicator: health?.terminal || noData },
    { title: "Water", icon: FaTint, indicator: health?.water || noData },
    { title: "Powders", icon: FaBoxOpen, indicator: health?.powders || noData },
    ...(health?.cups === null
      ? []
      : [{ title: "Cups", icon: FaWineGlass, indicator: health?.cups || noData }]),
  ];

  return (
    <SimpleGrid
      columns={{ base: 2, sm: items.length }}
      spacing="2"
      aria-label="Machine health"
    >
      {items.map((item) => (
        <HealthItem key={item.title} {...item} />
      ))}
    </SimpleGrid>
  );
}
