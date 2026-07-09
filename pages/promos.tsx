import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import { PortalShell } from "../components/portal/PortalShell";
import { requirePortalSession } from "../lib/portal/auth";
import { requestStrapiRestAsService } from "../services/server/strapiClient";
import type { PortalSession, PromoCode } from "../types/portal";

const getErrorMessage = (payload: any) => {
  if (typeof payload?.message === "string" && payload.message) return payload.message;
  if (typeof payload?.details === "string" && payload.details) return payload.details;

  if (payload?.details && typeof payload.details === "object") {
    try {
      return JSON.stringify(payload.details);
    } catch {
      return "Promo code could not be created.";
    }
  }

  return "Promo code could not be created.";
};

type PromosPageProps = {
  session: PortalSession;
  promos: PromoCode[];
  loadError?: string;
};

export default function PromosPage({ session, promos, loadError }: PromosPageProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [amount, setAmount] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const confirmed = window.confirm(
      "Create this promo code in the live client portal? Clients will be able to use it immediately once activated downstream.",
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    const response = await fetch("/api/portal/promos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title,
        code,
        discountType,
        amount: Number(amount),
        startAt,
        endAt,
        notes,
      }),
    });
    setIsSubmitting(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(getErrorMessage(payload));
      return;
    }

    router.replace(router.asPath);
  };

  return (
    <PortalShell
      title="Promos"
      description="Promo codes are scoped to the signed-in client. This uses Strapi as the local source of truth until the telemetry API promo listing contract is confirmed."
      clientName={session.client.company}
    >
      <SimpleGrid columns={{ base: 1, xl: 2 }} spacing="6">
        <Box bg="bg.900" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl" p="6">
          <Stack spacing="4">
            <Text color="acid.300" fontWeight="800">
              Existing promo codes
            </Text>
            {loadError ? <Text color="orange.200">{loadError}</Text> : null}
            {promos.length ? (
              promos.map((promo) => (
                <Box key={promo.id} border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p="4">
                  <Text color="bg.50" fontWeight="700">{promo.code}</Text>
                  <Text color="bg.300">
                    {promo.discount_type === "PERCENT" ? `${promo.amount}% off` : `$${promo.amount} off`}
                  </Text>
                  <Text color="bg.300">
                    {new Date(promo.start_at).toLocaleDateString()} to {new Date(promo.end_at).toLocaleDateString()}
                  </Text>
                </Box>
              ))
            ) : (
              <Text color="bg.300">No promo codes yet.</Text>
            )}
          </Stack>
        </Box>

        <Box
          as="form"
          onSubmit={onSubmit}
          bg="bg.900"
          border="1px solid"
          borderColor="whiteAlpha.100"
          borderRadius="2xl"
          p="6"
        >
          <Stack spacing="4">
            <Text color="acid.300" fontWeight="800">
              Create a promo code
            </Text>
            <FormControl>
              <FormLabel>Title</FormLabel>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>Code</FormLabel>
              <Input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} />
            </FormControl>
            <FormControl>
              <FormLabel>Discount type</FormLabel>
              <Select value={discountType} onChange={(event) => setDiscountType(event.target.value as "PERCENT" | "FIXED")}>
                <option value="PERCENT">Percent</option>
                <option value="FIXED">Fixed amount</option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Amount</FormLabel>
              <Input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="0" step="0.01" />
            </FormControl>
            <FormControl>
              <FormLabel>Starts at</FormLabel>
              <Input value={startAt} onChange={(event) => setStartAt(event.target.value)} type="datetime-local" />
            </FormControl>
            <FormControl>
              <FormLabel>Ends at</FormLabel>
              <Input value={endAt} onChange={(event) => setEndAt(event.target.value)} type="datetime-local" />
            </FormControl>
            <FormControl>
              <FormLabel>Notes</FormLabel>
              <Input value={notes} onChange={(event) => setNotes(event.target.value)} />
            </FormControl>

            {error ? <Text color="red.300">{error}</Text> : null}

            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              isDisabled={!code || !amount || !startAt || !endAt}
            >
              Create promo code
            </Button>
          </Stack>
        </Box>
      </SimpleGrid>
    </PortalShell>
  );
}

export const getServerSideProps: GetServerSideProps<PromosPageProps> = async (context) => {
  const result = await requirePortalSession(context);
  if ("redirect" in result) return { redirect: result.redirect };

  try {
    const params = new URLSearchParams();
    params.set("filters[client][id][$eq]", String(result.session.client.id));
    params.set("sort[0]", "start_at:desc");
    const promos = await requestStrapiRestAsService<PromoCode[]>(
      `/api/promo-codes?${params.toString()}`,
    );

    return {
      props: {
        session: result.session,
        promos,
      },
    };
  } catch (error) {
    console.error("[promos] load failed:", error);

    return {
      props: {
        session: result.session,
        promos: [],
        loadError: "Add the promo-code content type in Strapi to persist and list client promo codes.",
      },
    };
  }
};
