import type { NextApiRequest, NextApiResponse } from "next";
import normalize from "../../../services/normalizer";
import { requestStrapiRestPayloadAsService } from "../../../services/server/strapiClient";

const SALE_LIMIT = 10;
const STARTING_REVENUE_USD = 19_780;
const VOCABULARY_TTL_MS = 5 * 60 * 1000;
const EXCHANGE_RATE_TTL_MS = 60 * 60 * 1000;
const REVENUE_CACHE_TTL_MS = 20 * 1000;
const REVENUE_PAGE_SIZE = 500;
const MAX_REVENUE_PAGES = 200;
const EXCHANGE_RATE_URL =
  process.env.EXCHANGE_RATE_API_URL || "https://api.frankfurter.app/latest?from=USD";

type NamedRelation = { name?: string | null } | null;

type RecentSaleSource = {
  id: string | number;
  amount?: number | string | null;
  currency_code?: string | null;
  is_free?: boolean | null;
  product_name?: string | null;
  cup_size?: string | null;
  drink_volume_ml?: number | null;
  occurred_at?: string | null;
  machine?: {
    id?: string | number;
    serial_number?: string | null;
    country?: string | null;
    machine_type?: NamedRelation;
    currency?: { code?: string | null } | null;
  } | null;
  client?: { country?: string | null } | null;
  currency?: { code?: string | null } | null;
  product?: (NamedRelation & { brand?: NamedRelation }) | null;
  product_line?: NamedRelation;
  taste?: NamedRelation;
  taste_2?: NamedRelation;
  cup?: NamedRelation;
};

type ProductVocabulary = { brands: string[]; drinks: string[]; flavors: string[] };
type RevenueTransaction = {
  amount?: number | string | null;
  currency_code?: string | null;
  currency?: { code?: string | null } | null;
  machine?: {
    id?: string | number;
    serial_number?: string | null;
    currency?: { code?: string | null } | null;
  } | null;
};
type MachineRevenue = {
  amount: number;
  currency: string;
  approximate: boolean;
  transactionCount: number;
};
type StrapiListPayload = {
  data?: unknown[];
  meta?: {
    pagination?: { page?: number; pageCount?: number };
  };
};
type RevenueCache = {
  transactions: RevenueTransaction[];
  expiresAt: number;
};
type RevenueByCurrency = {
  totals: Map<string, number>;
  transactionCount: number;
};
type ExchangeRates = { date: string | null; rates: Record<string, number> };
let vocabularyCache: (ProductVocabulary & { expiresAt: number }) | null = null;
let exchangeRateCache: (ExchangeRates & { expiresAt: number }) | null = null;
let revenueCache: RevenueCache | null = null;

const maskSerial = (value?: string | null) => {
  const serial = String(value || "").trim();
  if (!serial) return "iShaker ***";
  return `${serial.slice(0, Math.max(1, serial.length - 3))}***`;
};

const asText = (value?: string | null) => String(value || "").trim();

const findLabelPart = (label: string, options: string[]) => {
  const normalized = label.toLocaleLowerCase();
  return options
    .filter((option) => normalized.includes(option.toLocaleLowerCase()))
    .sort((left, right) => right.length - left.length)[0] || "";
};

const removeLabelPart = (label: string, part: string) =>
  part ? label.replace(new RegExp(part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "").trim() : label;

const getProductVocabulary = async (): Promise<ProductVocabulary> => {
  if (vocabularyCache && vocabularyCache.expiresAt > Date.now()) return vocabularyCache;

  const makeParams = () => {
    const params = new URLSearchParams();
    params.set("fields[0]", "name");
    params.set("pagination[pageSize]", "2000");
    return params;
  };
  try {
    const [brandsPayload, drinksPayload, flavorsPayload] = await Promise.all([
      requestStrapiRestPayloadAsService<{ data?: unknown[] }>(`/api/brands?${makeParams()}`),
      requestStrapiRestPayloadAsService<{ data?: unknown[] }>(`/api/product-lines?${makeParams()}`),
      requestStrapiRestPayloadAsService<{ data?: unknown[] }>(`/api/tastes?${makeParams()}`),
    ]);
    const names = (data?: unknown[]) =>
      (normalize(data || []) as NamedRelation[])
        .map((item) => asText(item?.name))
        .filter(Boolean);

    vocabularyCache = {
      brands: names(brandsPayload.data),
      drinks: names(drinksPayload.data),
      flavors: names(flavorsPayload.data),
      expiresAt: Date.now() + VOCABULARY_TTL_MS,
    };
  } catch (error) {
    console.error("[public/recent-sales] product vocabulary load failed:", error);
    vocabularyCache = { brands: [], drinks: [], flavors: [], expiresAt: Date.now() + 30_000 };
  }
  return vocabularyCache;
};

const getExchangeRates = async (): Promise<ExchangeRates | null> => {
  if (exchangeRateCache && exchangeRateCache.expiresAt > Date.now()) return exchangeRateCache;

  try {
    const response = await fetch(EXCHANGE_RATE_URL, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(5_000),
    });
    const payload = (await response.json()) as {
      date?: string;
      rates?: Record<string, number>;
    };
    if (!response.ok || !payload.rates) return null;

    const rates = Object.fromEntries(
      Object.entries({ USD: 1, ...payload.rates })
        .map(([code, rate]) => [code.toUpperCase(), Number(rate)] as [string, number])
        .filter(([, rate]) => Number.isFinite(rate) && rate > 0),
    );
    exchangeRateCache = {
      date: payload.date || null,
      rates,
      expiresAt: Date.now() + EXCHANGE_RATE_TTL_MS,
    };
    return exchangeRateCache;
  } catch (error) {
    console.error("[public/recent-sales] exchange-rate load failed:", error);
    return null;
  }
};

const getRevenueTransactions = async (): Promise<RevenueTransaction[]> => {
  if (revenueCache && revenueCache.expiresAt > Date.now()) {
    return revenueCache.transactions;
  }

  const transactions: RevenueTransaction[] = [];
  for (let page = 1; page <= MAX_REVENUE_PAGES; page += 1) {
    const params = new URLSearchParams();
    params.set("filters[outcome][$eq]", "dispensed");
    params.set("filters[source][$in][0]", "kiosk");
    params.set("filters[source][$in][1]", "csv_harvest");
    params.set("fields[0]", "amount");
    params.set("fields[1]", "currency_code");
    params.set("populate[machine][fields][0]", "serial_number");
    params.set("populate[machine][populate][currency][fields][0]", "code");
    params.set("populate[currency][fields][0]", "code");
    params.set("pagination[page]", String(page));
    params.set("pagination[pageSize]", String(REVENUE_PAGE_SIZE));

    const payload = await requestStrapiRestPayloadAsService<StrapiListPayload>(
      `/api/sales?${params.toString()}`,
    );
    transactions.push(...(normalize(payload.data || []) as RevenueTransaction[]));
    const pageCount = Number(payload.meta?.pagination?.pageCount || 1);
    if (page >= pageCount) break;
  }

  revenueCache = {
    transactions,
    expiresAt: Date.now() + REVENUE_CACHE_TTL_MS,
  };
  return transactions;
};

const machineKey = (machine?: RevenueTransaction["machine"]) => {
  if (machine?.id !== undefined && machine.id !== null) return `id:${machine.id}`;
  const serial = asText(machine?.serial_number);
  return serial ? `serial:${serial}` : "";
};

const mapSale = (
  sale: RecentSaleSource,
  vocabulary: ProductVocabulary,
  revenueByMachine: Map<string, MachineRevenue>,
) => {
  const frozenLabel = asText(sale.product_name);
  const brand = asText(sale.product?.brand?.name) || findLabelPart(frozenLabel, vocabulary.brands);
  const labelWithoutBrand = removeLabelPart(frozenLabel, brand);
  const drink =
    asText(sale.product_line?.name) ||
    findLabelPart(labelWithoutBrand, vocabulary.drinks);
  const relationFlavor = [sale.taste?.name, sale.taste_2?.name]
    .map(asText)
    .filter(Boolean)
    .join(" + ");
  const catalogFlavor = findLabelPart(labelWithoutBrand, vocabulary.flavors);
  const parsedFlavor = drink ? removeLabelPart(labelWithoutBrand, drink) : "";
  const flavor = relationFlavor || parsedFlavor || catalogFlavor;
  const parsedDrink = removeLabelPart(labelWithoutBrand, flavor);
  const machineRevenue = revenueByMachine.get(machineKey(sale.machine));

  return {
    id: String(sale.id),
    country: asText(sale.machine?.country || sale.client?.country) || "Worldwide",
    machineType: asText(sale.machine?.machine_type?.name) || "iShaker",
    serialNumber: maskSerial(sale.machine?.serial_number),
    amount: Number(sale.amount || 0),
    currency:
      asText(
        sale.currency_code ||
          sale.currency?.code ||
          sale.machine?.currency?.code,
      ) || "USD",
    isFree: Boolean(sale.is_free),
    drink:
      asText(drink || sale.product?.name || parsedDrink || frozenLabel) ||
      "Fresh drink",
    brand: brand || "iShaker",
    cup:
      asText(sale.cup?.name || sale.cup_size) ||
      (sale.drink_volume_ml ? `${sale.drink_volume_ml} ml` : "Standard"),
    flavor: flavor || "Custom",
    soldAt: sale.occurred_at || null,
    ...(machineRevenue
      ? {
          machineRevenue: machineRevenue.amount,
          machineRevenueCurrency: machineRevenue.currency,
          machineRevenueApproximate: machineRevenue.approximate,
          machineTransactionCount: machineRevenue.transactionCount,
        }
      : {}),
  };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const params = new URLSearchParams();
  params.set("filters[outcome][$eq]", "dispensed");
  params.set("filters[source][$in][0]", "kiosk");
  params.set("filters[source][$in][1]", "csv_harvest");
  params.set("pagination[page]", "1");
  params.set("pagination[pageSize]", String(SALE_LIMIT));
  params.set("sort[0]", "occurred_at:DESC");
  [
    "amount",
    "currency_code",
    "is_free",
    "product_name",
    "cup_size",
    "drink_volume_ml",
    "occurred_at",
  ].forEach((field, index) => params.set(`fields[${index}]`, field));
  params.set("populate[machine][fields][0]", "serial_number");
  params.set("populate[machine][fields][1]", "country");
  params.set("populate[machine][populate][machine_type][fields][0]", "name");
  params.set("populate[machine][populate][currency][fields][0]", "code");
  params.set("populate[client][fields][0]", "country");
  params.set("populate[currency][fields][0]", "code");
  params.set("populate[product][fields][0]", "name");
  params.set("populate[product][populate][brand][fields][0]", "name");
  params.set("populate[product_line][fields][0]", "name");
  params.set("populate[taste][fields][0]", "name");
  params.set("populate[taste_2][fields][0]", "name");
  params.set("populate[cup][fields][0]", "name");

  try {
    const [payload, vocabulary, revenueTransactions, exchangeRates] = await Promise.all([
      requestStrapiRestPayloadAsService<{ data?: unknown[] }>(`/api/sales?${params.toString()}`),
      getProductVocabulary(),
      getRevenueTransactions(),
      getExchangeRates(),
    ]);
    const sales = normalize(payload.data || []) as RecentSaleSource[];
    const totalsByMachine = new Map<string, RevenueByCurrency>();
    for (const transaction of revenueTransactions) {
      const key = machineKey(transaction.machine);
      const amount = Number(transaction.amount || 0);
      const currency = asText(
        transaction.currency_code ||
          transaction.currency?.code ||
          transaction.machine?.currency?.code,
      ).toUpperCase();
      if (!key || !currency || !Number.isFinite(amount)) continue;
      const machine = totalsByMachine.get(key) || {
        totals: new Map<string, number>(),
        transactionCount: 0,
      };
      machine.totals.set(currency, (machine.totals.get(currency) || 0) + amount);
      machine.transactionCount += 1;
      totalsByMachine.set(key, machine);
    }

    const revenueByMachine = new Map<string, MachineRevenue>();
    let totalRevenueUsd = 0;
    let includedMachineCount = 0;
    const omittedCurrencies = new Set<string>();

    for (const [key, machine] of totalsByMachine) {
      const entries = [...machine.totals.entries()];
      if (entries.length === 1) {
        const [currency, amount] = entries[0];
        revenueByMachine.set(key, {
          amount: Math.round(amount * 100) / 100,
          currency,
          approximate: false,
          transactionCount: machine.transactionCount,
        });
      }

      let machineRevenueUsd = 0;
      let hasConvertibleRevenue = false;
      for (const [currency, amount] of entries) {
        const rate = exchangeRates?.rates[currency];
        if (!rate) {
          omittedCurrencies.add(currency);
          continue;
        }
        machineRevenueUsd += amount / rate;
        hasConvertibleRevenue = true;
      }
      if (hasConvertibleRevenue) {
        totalRevenueUsd += machineRevenueUsd;
        includedMachineCount += 1;
        if (entries.length > 1) {
          revenueByMachine.set(key, {
            amount: Math.round(machineRevenueUsd * 100) / 100,
            currency: "USD",
            approximate: true,
            transactionCount: machine.transactionCount,
          });
        }
      }
    }

    res.setHeader(
      "Cache-Control",
      "public, max-age=0, s-maxage=10, stale-while-revalidate=20",
    );
    return res.status(200).json({
      sales: sales.map((sale) =>
        mapSale(sale, vocabulary, revenueByMachine),
      ),
      revenue:
        exchangeRates && includedMachineCount
          ? {
              totalUsd:
                Math.round((STARTING_REVENUE_USD + totalRevenueUsd) * 100) /
                100,
              includedMachineCount,
              omittedCurrencyCount: omittedCurrencies.size,
              ratesDate: exchangeRates.date,
            }
          : null,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[public/recent-sales] load failed:", error);
    return res.status(500).json({ error: "recent_sales_load_failed" });
  }
}
