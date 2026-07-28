import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  useToast,
} from "@chakra-ui/react";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PortalShell } from "../components/portal/PortalShell";
import { requirePortalSession } from "../lib/portal/auth";
import { formatMoney } from "../lib/portal/currency";
import type { PortalSession } from "../types/portal";
import type { Currency, Sale } from "../types/strapi";
import Loader from "../components/shared/Loader";

type SalesPageProps = {
  session: PortalSession;
};

type SalesPayload = {
  sales: Sale[];
  totals: {
    count: number;
    byCurrency: Array<{
      currency: Currency;
      amount: number;
      count: number;
    }>;
  };
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
  nayax: {
    status: "unconfigured" | "ok" | "error";
    error?: string | null;
    lastSyncAt?: string | null;
  };
};

const fallbackCurrency = (sale: Sale): Currency => {
  if (sale.currency?.code) return sale.currency;
  if (sale.machine?.currency?.code) return sale.machine.currency;
  const code = (sale.currency_code || "USD").toUpperCase();
  return {
    id: `code:${code}`,
    code,
    symbol: code,
    symbol_position: "before",
    decimal_digits: 2,
  };
};

const statusColor = (status?: Sale["status"]) => {
  if (status === "settled" || status === "authorized") return "green";
  if (status === "declined") return "red";
  if (status === "refunded") return "orange";
  return "gray";
};

export default function SalesPage({ session }: SalesPageProps) {
  const toast = useToast();
  const [payload, setPayload] = useState<SalesPayload | null>(null);
  const [machineId, setMachineId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async (page = 1) => {
    setIsLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(page), pageSize: "25" });
    if (machineId) params.set("machineId", machineId);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const response = await fetch(`/api/portal/sales?${params.toString()}`, {
      cache: "no-store",
    });
    const nextPayload = await response.json().catch(() => null);
    setIsLoading(false);
    if (!response.ok) {
      const message = nextPayload?.message || "Sales could not be loaded.";
      setError(message);
      toast({ title: "Sales load failed", description: message, status: "error" });
      return;
    }
    setPayload(nextPayload);
  };

  useEffect(() => {
    void load();
    // Filters are applied explicitly with the Apply filters button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PortalShell
      title="Sales"
      description="Nayax transactions imported into Strapi for your account."
      clientName={session.client.company}
    >
      <Box
        bg="bg.900"
        border="1px solid"
        borderColor="whiteAlpha.100"
        borderRadius="2xl"
        p="5"
        mb="6"
      >
        <HStack align="end" spacing="4" flexWrap="wrap">
          <FormControl maxW="260px">
            <FormLabel>Machine</FormLabel>
            <Select
              value={machineId}
              onChange={(event) => setMachineId(event.target.value)}
              placeholder="All machines"
            >
              {session.machines.map((machine) => (
                <option key={machine.id} value={machine.id}>
                  {machine.title || machine.serial_number}
                </option>
              ))}
            </Select>
          </FormControl>
          <FormControl maxW="190px">
            <FormLabel>From</FormLabel>
            <Input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
          </FormControl>
          <FormControl maxW="190px">
            <FormLabel>To</FormLabel>
            <Input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </FormControl>
          <Button variant="primary" onClick={() => void load(1)}>
            Apply filters
          </Button>
        </HStack>
      </Box>

      {error ? (
        <Alert status="error" mb="5" borderRadius="xl">
          <AlertIcon />
          {error}
        </Alert>
      ) : null}
      {payload?.nayax.status === "error" ? (
        <Alert status="error" mb="5" borderRadius="xl">
          <AlertIcon />
          {payload.nayax.error ||
            "The latest Nayax synchronization failed. Check the account token."}
        </Alert>
      ) : null}

      <SimpleGrid
        columns={{ base: 1, md: Math.min(3, 1 + (payload?.totals.byCurrency.length || 1)) }}
        spacing="5"
        mb="6"
      >
        <Box bg="bg.900" borderRadius="2xl" p="6">
          <Stat>
            <StatLabel color="bg.300">Sales count</StatLabel>
            <StatNumber color="bg.50">{payload?.totals.count || 0}</StatNumber>
          </Stat>
        </Box>
        {(payload?.totals.byCurrency || []).map((total) => (
          <Box key={total.currency.code} bg="bg.900" borderRadius="2xl" p="6">
            <Stat>
              <StatLabel color="bg.300">
                Revenue ({total.currency.code})
              </StatLabel>
              <StatNumber color="bg.50">
                {formatMoney(total.amount, total.currency)}
              </StatNumber>
            </Stat>
          </Box>
        ))}
      </SimpleGrid>

      <Box
        bg="bg.900"
        border="1px solid"
        borderColor="whiteAlpha.100"
        borderRadius="2xl"
        p="6"
      >
        {isLoading ? (
          <HStack py="10" justify="center">
            <Loader size="md" />
            <Text color="bg.300">Loading sales…</Text>
          </HStack>
        ) : payload?.nayax.status === "unconfigured" &&
          !payload.sales.length ? (
          <VStack py="10" spacing="4">
            <Text color="acid.300" fontWeight="800">
              Connect Nayax to import sales
            </Text>
            <Text color="bg.300" textAlign="center">
              Add the account token, then set each machine&apos;s Nayax terminal ID.
            </Text>
            <Button as={Link} href="/machines" variant="primary">
              Open Nayax settings
            </Button>
          </VStack>
        ) : !payload?.sales.length ? (
          <Text color="bg.300" py="10" textAlign="center">
            No transactions match these filters.
          </Text>
        ) : (
          <>
            <TableContainer>
              <Table minW="900px">
                <Thead>
                  <Tr>
                    <Th pl="0">Date</Th>
                    <Th>Machine</Th>
                    <Th>Amount</Th>
                    <Th>Payment</Th>
                    <Th>Product</Th>
                    <Th pr="0">Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {payload.sales.map((sale) => (
                    <Tr key={sale.id}>
                      <Td pl="0">
                        {sale.occurred_at
                          ? new Date(sale.occurred_at).toLocaleString()
                          : "—"}
                      </Td>
                      <Td>
                        {sale.machine?.title ||
                          sale.nayax_terminal_id ||
                          "Unmapped terminal"}
                      </Td>
                      <Td fontWeight="700">
                        {formatMoney(sale.amount, fallbackCurrency(sale))}
                      </Td>
                      <Td>
                        {[sale.payment_method, sale.card_brand]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </Td>
                      <Td>{sale.product_name || "—"}</Td>
                      <Td pr="0">
                        <Badge colorScheme={statusColor(sale.status)}>
                          {sale.status || "unknown"}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
            <HStack justify="space-between" mt="5">
              <Text color="bg.300" fontSize="sm">
                Page {payload.pagination.page} of {payload.pagination.pageCount}
              </Text>
              <HStack>
                <Button
                  size="sm"
                  isDisabled={payload.pagination.page <= 1}
                  onClick={() => void load(payload.pagination.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  isDisabled={
                    payload.pagination.page >= payload.pagination.pageCount
                  }
                  onClick={() => void load(payload.pagination.page + 1)}
                >
                  Next
                </Button>
              </HStack>
            </HStack>
          </>
        )}
      </Box>
    </PortalShell>
  );
}

export const getServerSideProps: GetServerSideProps<SalesPageProps> = async (
  context,
) => {
  const result = await requirePortalSession(context);
  if ("redirect" in result) return { redirect: result.redirect };
  return { props: { session: result.session } };
};
