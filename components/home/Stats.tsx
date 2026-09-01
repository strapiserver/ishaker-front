import {
  Badge,
  Box,
  Container,
  Flex,
  HStack,
  Icon,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { FaDroplet, FaGlassWater, FaTag } from "react-icons/fa6";
import CustomTitle from "./CutsomTitle";

const REFRESH_INTERVAL_MS = 60 * 60 * 1000;

type RecentSale = {
  id: string;
  country: string;
  machineType: string;
  serialNumber: string;
  amount: number;
  currency: string;
  isFree: boolean;
  drink: string;
  brand: string;
  cup: string;
  flavor: string;
  soldAt: string | null;
  machineRevenue?: number;
  machineRevenueCurrency?: string;
  machineRevenueApproximate?: boolean;
  machineTransactionCount?: number;
};

type RecentSalesResponse = {
  sales?: RecentSale[];
  revenue?: {
    totalUsd: number;
    includedMachineCount: number;
    omittedCurrencyCount: number;
    ratesDate: string | null;
  } | null;
  updatedAt?: string;
};

const COUNTRY_CODES: Record<string, string> = {
  usa: "US",
  "united states": "US",
  "united states of america": "US",
  canada: "CA",
  mexico: "MX",
  uk: "GB",
  "united kingdom": "GB",
  australia: "AU",
  greece: "GR",
  germany: "DE",
  france: "FR",
  spain: "ES",
  italy: "IT",
  poland: "PL",
  ukraine: "UA",
};

function countryFlag(country: string) {
  const normalized = country.trim();
  const code =
    (normalized.length === 2 ? normalized : COUNTRY_CODES[normalized.toLowerCase()])?.toUpperCase();
  if (!code || !/^[A-Z]{2}$/.test(code)) return "🌎";
  return String.fromCodePoint(...[...code].map((letter) => 127397 + letter.charCodeAt(0)));
}

function formatPrice(sale: RecentSale) {
  if (sale.isFree) return "Free";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: sale.currency,
      maximumFractionDigits: 2,
    }).format(sale.amount);
  } catch {
    return `${sale.currency} ${sale.amount.toFixed(2)}`;
  }
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function SaleCard({ sale, index }: { sale: RecentSale; index: number }) {
  const cardBg = useColorModeValue("white", "bg.800");
  const detailBg = useColorModeValue("bg.50", "bg.900");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.100");
  const muted = useColorModeValue("bg.500", "bg.300");

  return (
    <Box
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="2xl"
      p={{ base: "4", md: "5" }}
      boxShadow="sm"
      transition="transform .2s ease, border-color .2s ease"
      _hover={{ transform: "translateY(-2px)", borderColor: "acid.500" }}
    >
      <Flex justify="space-between" align="start" gap="3">
        <HStack minW="0" spacing="2">
          <Text fontSize="2xl" lineHeight="1" aria-label={sale.country}>
            {countryFlag(sale.country)}
          </Text>
          <Box minW="0">
            <Text fontWeight="700" noOfLines={1}>{sale.machineType}</Text>
            <Text color={muted} fontSize="xs" noOfLines={1}>{sale.serialNumber}</Text>
          </Box>
        </HStack>
        <Badge colorScheme="green" borderRadius="full" px="2.5" py="1">
          {index === 0 ? "Just sold" : "Sold"}
        </Badge>
      </Flex>

      <Flex mt="5" align="end" justify="space-between" gap="3">
        <Box minW="0">
          <Text color={muted} fontSize="xs" textTransform="uppercase" letterSpacing="wide">
            Drink
          </Text>
          <Text fontSize="lg" fontWeight="800" noOfLines={1}>{sale.drink}</Text>
        </Box>
        <Text color="acid.600" fontSize="xl" fontWeight="800" whiteSpace="nowrap">
          {formatPrice(sale)}
        </Text>
      </Flex>

      <SimpleGrid columns={3} spacing="2" mt="5">
        {[
          { icon: FaTag, label: "Brand", value: sale.brand },
          { icon: FaGlassWater, label: "Cup", value: sale.cup },
          { icon: FaDroplet, label: "Flavor", value: sale.flavor },
        ].map((detail) => (
          <Box key={detail.label} bg={detailBg} borderRadius="xl" p="2.5" minW="0">
            <HStack spacing="1" color={muted}>
              <Icon as={detail.icon} boxSize="2.5" />
              <Text fontSize="10px" textTransform="uppercase">{detail.label}</Text>
            </HStack>
            <Text mt="1" fontSize="xs" fontWeight="700" noOfLines={1}>{detail.value}</Text>
          </Box>
        ))}
      </SimpleGrid>

      {sale.machineRevenue !== undefined && sale.machineRevenueCurrency ? (
        <Flex mt="4" pt="4" borderTop="1px solid" borderColor={borderColor} justify="space-between" gap="3">
          <Box>
            <Text color={muted} fontSize="sm">
              {sale.machineRevenueApproximate ? "Approx. machine total revenue" : "Machine total revenue"}
            </Text>
            {sale.machineTransactionCount !== undefined ? (
              <Text color={muted} fontSize="xs">
                Sum of {sale.machineTransactionCount} {sale.machineTransactionCount === 1 ? "transaction" : "transactions"}
              </Text>
            ) : null}
          </Box>
          <Text fontSize="sm" fontWeight="800">
            {formatMoney(sale.machineRevenue, sale.machineRevenueCurrency)}
          </Text>
        </Flex>
      ) : null}
    </Box>
  );
}

export function Stats() {
  const [sales, setSales] = useState<RecentSale[]>([]);
  const [revenue, setRevenue] = useState<RecentSalesResponse["revenue"]>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const muted = useColorModeValue("bg.500", "bg.300");
  const totalBg = useColorModeValue("bg.100", "bg.800");
  const uniqueCountries = useMemo(() => new Set(sales.map((sale) => sale.country)).size, [sales]);

  useEffect(() => {
    let active = true;
    let controller: AbortController | null = null;

    async function loadSales() {
      controller?.abort();
      controller = new AbortController();
      try {
        const response = await fetch("/api/public/recent-sales", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Recent sales request failed with ${response.status}`);
        const payload = (await response.json()) as RecentSalesResponse;
        if (active) {
          setSales(payload.sales || []);
          setRevenue(payload.revenue || null);
          setHasError(false);
        }
      } catch (error) {
        if (active && !(error instanceof DOMException && error.name === "AbortError")) {
          setHasError(true);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadSales();
    const interval = window.setInterval(loadSales, REFRESH_INTERVAL_MS);
    return () => {
      active = false;
      controller?.abort();
      window.clearInterval(interval);
    };
  }, []);

  return (
    <Container maxW="7xl" py={{ base: "10", md: "16" }}>
      <CustomTitle
        as="h2"
        title="Shakes happening now"
        subtitle="A live look at the 10 most recent drinks served across iShaker machines."
        mt="0"
        mb={{ base: "7", md: "10" }}
        fontSize={{ base: "3xl", md: "6xl" }}
      />

      <Flex justify="center" mb="6">
        <HStack spacing="4" color={muted} fontSize="sm">
          <HStack spacing="2"><Box boxSize="2" bg="acid.500" borderRadius="full" /><Text>Live · updates every hour</Text></HStack>
          {sales.length ? <Text>{sales.length} sales · {uniqueCountries} {uniqueCountries === 1 ? "country" : "countries"}</Text> : null}
        </HStack>
      </Flex>

      {revenue ? (
        <Box
          mb="6"
          mx="auto"
          maxW="560px"
          borderRadius="2xl"
          bg={totalBg}
          px={{ base: "5", md: "7" }}
          py="5"
          textAlign="center"
        >
          <Text color={muted} fontSize="xs" textTransform="uppercase" letterSpacing="widest">
            Approximate total revenue
          </Text>
          <Text color="acid.600" fontSize={{ base: "3xl", md: "4xl" }} fontWeight="800">
            {formatMoney(revenue.totalUsd, "USD")}
          </Text>
          <Text color={muted} fontSize="xs">
            Converted to USD{revenue.ratesDate ? ` using ${revenue.ratesDate} rates` : ""}
            {revenue.omittedCurrencyCount ? ` · ${revenue.omittedCurrencyCount} unsupported ${revenue.omittedCurrencyCount === 1 ? "currency" : "currencies"} omitted` : ""}
          </Text>
        </Box>
      ) : null}

      {isLoading ? (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing="4">
          {[0, 1, 2, 3].map((item) => <Skeleton key={item} h="220px" borderRadius="2xl" />)}
        </SimpleGrid>
      ) : sales.length ? (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing="4">
          {sales.map((sale, index) => <SaleCard key={sale.id} sale={sale} index={index} />)}
        </SimpleGrid>
      ) : (
        <Stack align="center" py="10" color={muted}>
          <Text fontWeight="700">{hasError ? "Live sales are reconnecting…" : "The next fresh shake will appear here."}</Text>
          <Text fontSize="sm">This feed checks automatically every hour.</Text>
        </Stack>
      )}
    </Container>
  );
}
