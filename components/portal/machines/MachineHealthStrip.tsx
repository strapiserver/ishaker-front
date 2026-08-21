import {
  Badge,
  Box,
  HStack,
  Icon,
  SimpleGrid,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react";
import type { IconType } from "react-icons";
import { useState } from "react";
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
import type { Machine } from "../../../types/strapi";
import {
  MachineHealthDialog,
  type HealthDialogKind,
} from "../health/MachineHealthDialog";

type MachineHealthStripProps = {
  machine: Machine;
  health?: MachineHealthRow;
  isLoading?: boolean;
  onHealthChanged?: () => void;
};

const stateColor: Record<HealthState, string> = {
  ok: "green",
  warning: "yellow",
  low: "orange",
  error: "red",
  unknown: "gray",
};

const stateBackground: Record<HealthState, { base: string; hover: string }> = {
  ok: { base: "rgba(34, 197, 94, 0.14)", hover: "rgba(34, 197, 94, 0.22)" },
  warning: { base: "rgba(234, 179, 8, 0.14)", hover: "rgba(234, 179, 8, 0.22)" },
  low: { base: "rgba(249, 115, 22, 0.14)", hover: "rgba(249, 115, 22, 0.22)" },
  error: { base: "rgba(239, 68, 68, 0.14)", hover: "rgba(239, 68, 68, 0.22)" },
  unknown: { base: "rgba(148, 163, 184, 0.10)", hover: "rgba(148, 163, 184, 0.18)" },
};

const lastOnlineLabel = (at?: string | null) => {
  if (!at) return "Last online unavailable";
  const timestamp = Date.parse(at);
  if (Number.isNaN(timestamp)) return "Last online unavailable";
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60_000));
  if (minutes < 1) return "Last online just now";
  if (minutes < 60) return `Last online ${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Last online ${hours}h ago`;
  const days = Math.round(hours / 24);
  return `Last online ${days}d ago`;
};

const HealthItem = ({
  title,
  icon,
  indicator,
  showLastOnline = false,
  onClick,
  powderLevels,
}: {
  title: string;
  icon: IconType;
  indicator: MachineHealthIndicator;
  showLastOnline?: boolean;
  onClick: () => void;
  powderLevels?: Array<number | null>;
}) => {
  const color = stateColor[indicator.state];
  const background = stateBackground[indicator.state];
  const lastOnline = lastOnlineLabel(indicator.lastOnlineAt);

  return (
    <VStack
      as="button"
      type="button"
      align="start"
      onClick={onClick}
      aria-label={`Open ${title} details`}
      spacing="1"
      minW="0"
      py="2"
      px="1"
      borderRadius="lg"
      bg={background.base}
      cursor="pointer"
      textAlign="left"
      transition="background 140ms ease, transform 140ms ease"
      _hover={{ bg: background.hover, transform: "translateY(-1px)" }}
      _focusVisible={{ boxShadow: "outline" }}
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
          {powderLevels?.length ? (
            <HStack
              spacing="2px"
              h="12px"
              align="end"
              aria-label={`Powder levels: ${powderLevels
                .map((level) => (level === null ? "empty" : `${Math.round(level)}%`))
                .join(", ")}`}
            >
              {powderLevels.map((level, index) => {
                const normalized =
                  level === null ? 0 : Math.max(0, Math.min(100, level));
                const fillColor =
                  normalized < 10
                    ? "red.400"
                    : normalized < 20
                      ? "orange.400"
                      : normalized < 40
                        ? "yellow.400"
                        : "green.400";
                const fillHeight =
                  normalized < 10
                    ? "1px"
                    : normalized < 20
                    ? "3px"
                    : `${Math.max(1, Math.round(normalized / 10))}px`;

                return (
                  <Box
                    key={index}
                    position="relative"
                    w="6px"
                    h="10px"
                    overflow="hidden"
                    borderRadius="1px"
                    bg="bg.500"
                  >
                    {level !== null && normalized > 0 ? (
                      <Box
                        position="absolute"
                        insetX="0"
                        bottom="0"
                        h={fillHeight}
                        bg={fillColor}
                      />
                    ) : null}
                  </Box>
                );
              })}
            </HStack>
          ) : (
            <Text color="bg.50" fontSize="xs" fontWeight="700" noOfLines={1}>
              {indicator.label}
            </Text>
          )}
        </Box>
      </HStack>

      {indicator.source !== "ops" && indicator.source !== "own" ? (
        <Badge colorScheme={color} fontSize="8px" lineHeight="14px">
          {indicator.source}
        </Badge>
      ) : null}
    </VStack>
  );
};

const noData: MachineHealthIndicator = {
  state: "unknown",
  label: "No data",
  source: "none",
};

export function MachineHealthStrip({
  machine,
  health,
  isLoading = false,
  onHealthChanged = () => undefined,
}: MachineHealthStripProps) {
  const [dialog, setDialog] = useState<HealthDialogKind | null>(null);
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
    {
      title: "Online",
      dialog: "wifi" as const,
      icon: FaWifi,
      indicator: health?.online || noData,
      showLastOnline: true,
    },
    {
      title: "Nayax",
      dialog: "nayax" as const,
      icon: FaCreditCard,
      indicator: health?.terminal || noData,
    },
    {
      title: "Water",
      dialog: "water" as const,
      icon: FaTint,
      indicator: health?.water || noData,
    },
    {
      title: "Powders",
      dialog: "powders" as const,
      icon: FaBoxOpen,
      indicator: health?.powders || noData,
      powderLevels: health?.powderLevels,
    },
    {
      title: "Cups",
      dialog: "cups" as const,
      icon: FaWineGlass,
      indicator: health?.cups || noData,
    },
  ];

  return (
    <>
      <SimpleGrid
        columns={{ base: 2, sm: items.length }}
        spacing="2"
        aria-label="Machine health"
      >
        {items.map((item) => (
          <HealthItem
            key={item.title}
            {...item}
            onClick={() => setDialog(item.dialog)}
          />
        ))}
      </SimpleGrid>
      <MachineHealthDialog
        kind={dialog}
        machine={{
          ...machine,
          water_type: health?.waterType ?? machine.water_type,
          water_amount_liters:
            health?.waterAmountLiters ?? machine.water_amount_liters,
          cups_amount: health?.cupsAmount ?? machine.cups_amount,
        }}
        onClose={() => setDialog(null)}
        onSaved={onHealthChanged}
      />
    </>
  );
}
