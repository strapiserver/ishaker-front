import type { NextApiRequest, NextApiResponse } from "next";
import {
  assertMachineBelongsToSessionClient,
  getPortalSessionFromApiRequest,
} from "../../../lib/portal/auth";
import { requestStrapiRestAsService } from "../../../services/server/strapiClient";
import type { Currency, Sale } from "../../../types/strapi";

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] || "" : value || "";

const dateBoundary = (value: string, endOfDay: boolean) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const timestamp = `${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`;
  return Number.isNaN(Date.parse(timestamp)) ? "" : timestamp;
};

const currencyForSale = (sale: Sale): Currency => {
  if (sale.currency?.code) return sale.currency;
  if (sale.machine?.currency?.code) return sale.machine.currency;
  const code = (sale.currency_code || "USD").toUpperCase();
  return {
    id: `code:${code}`,
    code,
    name: code,
    symbol: code,
    symbol_position: "before",
    decimal_digits: 2,
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const session = await getPortalSessionFromApiRequest(req);
  if (!session || session.access !== "client" || !session.client.id) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const machineId = first(req.query.machineId).trim();
  if (machineId) {
    const machine =
      /^\d+$/.test(machineId)
        ? await assertMachineBelongsToSessionClient(session, machineId)
        : null;
    if (!machine) {
      return res.status(403).json({ error: "machine_access_denied" });
    }
  }

  const rawFrom = first(req.query.from).trim();
  const rawTo = first(req.query.to).trim();
  const from = rawFrom ? dateBoundary(rawFrom, false) : "";
  const to = rawTo ? dateBoundary(rawTo, true) : "";
  if ((rawFrom && !from) || (rawTo && !to) || (from && to && from > to)) {
    return res.status(400).json({
      error: "invalid_date_range",
      message: "Enter a valid sales date range.",
    });
  }

  const page = Math.max(1, Number(first(req.query.page)) || 1);
  const pageSize = Math.min(
    100,
    Math.max(10, Number(first(req.query.pageSize)) || 25),
  );
  const params = new URLSearchParams();
  params.set("filters[client][id][$eq]", String(session.client.id));
  if (machineId) params.set("filters[machine][id][$eq]", machineId);
  if (from) params.set("filters[occurred_at][$gte]", from);
  if (to) params.set("filters[occurred_at][$lte]", to);
  [
    "nayax_transaction_id",
    "nayax_terminal_id",
    "amount",
    "currency_code",
    "payment_method",
    "card_brand",
    "product_name",
    "status",
    "occurred_at",
  ].forEach((field, index) => params.set(`fields[${index}]`, field));
  params.set("populate[machine][fields][0]", "title");
  params.set("populate[machine][fields][1]", "serial_number");
  params.set("populate[machine][fields][2]", "nayax_terminal_id");
  params.set("populate[machine][populate][currency]", "*");
  params.set("populate[currency]", "*");
  params.set("sort[0]", "occurred_at:DESC");
  params.set("pagination[pageSize]", "500");

  try {
    const allSales: Sale[] = [];
    let sourcePage = 1;
    while (true) {
      params.set("pagination[page]", String(sourcePage));
      const salesPage = await requestStrapiRestAsService<Sale[]>(
        `/api/sales?${params.toString()}`,
      );
      allSales.push(...salesPage);
      if (salesPage.length < 500) break;
      sourcePage += 1;
    }
    const totalsByCurrency = new Map<
      string,
      { currency: Currency; amount: number; count: number }
    >();
    allSales.forEach((sale) => {
      const currency = currencyForSale(sale);
      const key = currency.code.toUpperCase();
      const total = totalsByCurrency.get(key) || {
        currency,
        amount: 0,
        count: 0,
      };
      const amount = Number(sale.amount);
      if (Number.isFinite(amount)) total.amount += amount;
      total.count += 1;
      totalsByCurrency.set(key, total);
    });

    const offset = (page - 1) * pageSize;
    return res.status(200).json({
      sales: allSales.slice(offset, offset + pageSize),
      totals: {
        count: allSales.length,
        byCurrency: Array.from(totalsByCurrency.values()),
      },
      pagination: {
        page,
        pageSize,
        pageCount: Math.max(1, Math.ceil(allSales.length / pageSize)),
        total: allSales.length,
      },
      nayax: {
        status: session.client.nayax_status || "unconfigured",
        error: session.client.nayax_error || null,
        lastSyncAt: session.client.nayax_last_sync_at || null,
      },
    });
  } catch (error) {
    console.error("[portal/sales] load failed:", error);
    return res.status(500).json({
      error: "sales_load_failed",
      message: "Sales could not be loaded.",
    });
  }
}
