# Codex task — public fleet stats from `/api/statistic`

## What changed on the backend

Strapi now publishes the whole public-facing fleet picture as **one pre-computed,
pre-masked, unauthenticated JSON**:

```
GET https://admin.ishaker.xyz/api/statistic
→ { "data": { "attributes": { "stats": { … } } } }
```

No token. No GraphQL. No service account. No pagination. It is a Strapi **single type**
with one `json` field, rebuilt every hour by `fleetstats.py` on the Strapi host straight
after the sales collector runs.

Everything the site currently computes at request time — walking sale pages, resolving
brands and flavours out of product names, converting currencies against a live rate API —
is already done inside that JSON. **This task is mostly deletion.**

---

## 1. Replace `pages/api/public/recent-sales.ts`

That route is 383 lines and does work that no longer needs doing:

| It currently does | Why it can go |
|---|---|
| `requestStrapiRestPayloadAsService(...)` over `/api/sales` | `/api/statistic` is public — no service account, no secret in the request path |
| Page-walks up to `MAX_REVENUE_PAGES * REVENUE_PAGE_SIZE` = 100 000 rows | Totals are precomputed. One request, a few KB |
| `EXCHANGE_RATE_URL` → `api.frankfurter.app` at request time | Rates ship inside the payload (`stats.fx.rates_to_usd`), already applied to `revenue_usd_approx` |
| Rebuilds a brand/drink/flavour vocabulary and parses `product_name` | The backend already resolved brand / product line / taste, with Strapi ids where they matched |
| `STARTING_REVENUE_USD = 19_780` hardcoded offset | See §5 — decide deliberately, do not carry it over silently |

**Keep the route as a thin proxy**, do not fetch Strapi from the browser directly. Reasons:
it keeps the Strapi origin out of the client bundle, it gives you one place to cache, and
it lets you serve the last good payload when Strapi is mid-restart (see §6).

Target shape for the rewritten route — roughly 40 lines:

```ts
// pages/api/public/fleet-stats.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getStrapiBaseUrl } from "../../../services/fetchers";

const TTL_MS = 5 * 60 * 1000;
let cache: { at: number; payload: any } | null = null;

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  if (cache && Date.now() - cache.at < TTL_MS) {
    return res.status(200).json(cache.payload);
  }
  try {
    const r = await fetch(`${getStrapiBaseUrl()}/api/statistic`);
    if (!r.ok) throw new Error(String(r.status));
    const stats = (await r.json())?.data?.attributes?.stats;
    if (!stats) throw new Error("empty stats");
    cache = { at: Date.now(), payload: stats };
    return res.status(200).json(stats);
  } catch {
    // Serve stale rather than nothing: the source refreshes hourly, so a five-minute-old
    // copy is indistinguishable from a fresh one, and Strapi restarts are routine.
    if (cache) return res.status(200).json(cache.payload);
    return res.status(503).json({ error: "stats unavailable" });
  }
}
```

Delete `pages/api/public/recent-sales.ts` once `components/home/Stats.tsx` is repointed.

---

## 2. The payload

Live sample, trimmed to two entries per array (fetch the real thing to see it all):

```json
{
  "generated_at": "2026-09-02T21:14:59Z",
  "recent_transactions": [
    {
      "at": "2026-09-02T20:03:16.000Z",
      "country": "United States",
      "machine_type": "shaker s",
      "serial_masked": "24***678",
      "amount": 0,
      "currency": "USD",
      "product_line": {
        "id": 45,
        "name": "Protein"
      },
      "taste": {
        "id": null,
        "name": "Cinnamon crunch"
      },
      "brand": {
        "id": null,
        "name": "ryse Loaded"
      },
      "powder_g": 40
    },
    {
      "at": "2026-09-02T20:02:52.000Z",
      "country": "Spain",
      "machine_type": "shaker touch",
      "serial_masked": "260***075",
      "amount": 2.5,
      "currency": "EUR",
      "product_line": {
        "id": 9,
        "name": "Whey Protein"
      },
      "taste": {
        "id": 253,
        "name": "chocolate monkey"
      },
      "brand": {
        "id": 310,
        "name": "Life Pro Nutrition"
      },
      "powder_g": 50
    }
  ],
  "machines": [
    {
      "serial_masked": "24***321",
      "machine_type": "shaker s",
      "country": "United States",
      "country_source": "client",
      "active_tastes": [
        "Blue Raspberry",
        "chocolate hazelnut",
        "ZERO Watermelon",
        "strawberry banana",
        "Chocolate",
        "fruit blast",
        "Coconut",
        "Vanilla",
        "Watermelon",
        "ZERO Sandía"
      ],
      "active_tastes_source": "recent_sales",
      "cups_total": 405,
      "free_cups": 17,
      "days_operating": 86,
      "first_sale_at": "2026-06-09T16:02:59Z",
      "last_sale_at": "2026-09-02T19:04:15Z",
      "currency": "USD",
      "revenue_last_week": 160.82,
      "revenue_last_month": 616.16,
      "revenue_total": 1924.46,
      "revenue_total_charged": 1838.16,
      "revenue_total_usd_approx": 1924.46,
      "powder_g_total": 8539
    },
    {
      "serial_masked": "260***075",
      "machine_type": "shaker touch",
      "country": "Spain",
      "country_source": "machine",
      "active_tastes": [
        "Limonada",
        "Helado de Vainilla (GF)",
        "Fresa Platano (GF)",
        "Calipo de Lima +18",
        "Tropical Punch",
        "Pro Cao (GF)",
        "Chocolate Monkey"
      ],
      "active_tastes_source": "planogram",
      "cups_total": 297,
      "free_cups": 74,
      "days_operating": 8,
      "first_sale_at": "2026-08-26T11:05:07Z",
      "last_sale_at": "2026-09-02T20:02:52Z",
      "currency": "EUR",
      "revenue_last_week": 581.11,
      "revenue_last_month": 652.46,
      "revenue_total": 652.46,
      "revenue_total_charged": 483.01,
      "revenue_total_usd_approx": 704.66,
      "powder_g_total": 8259
    }
  ],
  "totals": {
    "machines_reporting": 18,
    "machines_listed": 39,
    "cups_total": 998,
    "free_cups_total": 222,
    "revenue_by_currency": {
      "USD": {
        "cups": 687,
        "revenue": 3195.03,
        "charged": 2612.58
      },
      "EUR": {
        "cups": 298,
        "revenue": 657.46,
        "charged": 483.01
      },
      "MXN": {
        "cups": 1,
        "revenue": 5.49,
        "charged": 0
      },
      "ARS": {
        "cups": 10,
        "revenue": 18085,
        "charged": 4530
      },
      "TRY": {
        "cups": 2,
        "revenue": 330,
        "charged": 0
      }
    },
    "revenue_usd_approx": 3928.52,
    "unconverted_currencies": []
  },
  "fx": {
    "basis": "USD",
    "approximate": true,
    "note": "Static table, not a live rate feed. A currency with no rate is excluded from revenue_usd_approx and listed in totals.unconverted_currencies.",
    "rates_to_usd": {
      "USD": 1,
      "EUR": 1.08,
      "GBP": 1.27,
      "TRY": 0.029,
      "ARS": 0.00075,
      "MXN": 0.055
    }
  },
  "notes": {
    "cups": "Every dispensed drink counts as a cup sold.",
    "revenue": "revenue_* value a free-mode cup at its list price; revenue_total_charged is what was actually billed.",
    "active_tastes": "active_tastes_source=planogram means containers that are switched on and not empty in Strapi; recent_sales means the machine has no planogram and these are the flavours it has actually poured.",
    "country": "country_source says where it came from: machine, client, or timezone. timezone is a guess and can be wrong by a border.",
    "days_operating": "Days since the FIRST transaction we hold, which is bounded by how far back the machine's own CSVs go, not by how long it has been installed.",
    "serials": "Middle three characters masked."
  }
}
```

---

## 3. `components/home/Stats.tsx` — repoint, do not rewrite

The component's own `RecentSale` type maps almost one-to-one. Change the fetch to
`/api/public/fleet-stats` and map `stats.recent_transactions[]`:

| `RecentSale` field | comes from | note |
|---|---|---|
| `id` | — | no id is published; use `at` + `serial_masked` as the React key |
| `country` | `country` | already normalised — "USA"/"United States"/"TURKEY"/"Italia" are collapsed to one spelling each. Your `COUNTRY_CODES` map still works, and it can shrink |
| `machineType` | `machine_type` | `"shaker s"` / `"shaker touch"` / `"milkshaker"` |
| `serialNumber` | `serial_masked` | **already masked** — never unmask, never re-mask |
| `amount`, `currency` | `amount`, `currency` | |
| `isFree` | `amount === 0` | free cups are published with `amount: 0`; see §5 |
| `brand` | `brand.name` | `brand` may be `null`, or `{id: null, name: "…"}` if the brand is not in the Strapi catalogue |
| `drink` | `product_line.name` | same nullability |
| `flavor` | `taste.name` | same nullability |
| `soldAt` | `at` | ISO-8601 UTC |
| `cup` | — | not published. Drop the field or leave it empty |

`machineRevenue*` and `machineTransactionCount` are no longer per-sale — they live in
`stats.machines[]` now. Wire the fleet totals from `stats.totals` instead.

**Nullability is the one thing to get right.** `brand`, `product_line` and `taste` are each
independently `null` when the vendor's product string could not be split against the
catalogue. Render a dash, not `undefined`, and never join them into a sentence without
guarding each part.

---

## 4. New section: per-machine cards

`stats.machines[]` is new and has no UI yet. 39 entries; **24 of them have
`cups_total: 0`** because the machine is offline or has no sale cache — decide whether to
show them as "no data yet" or filter them out. Sorted by `cups_total` descending.

Per machine: `serial_masked`, `machine_type`, `country`, `active_tastes[]`,
`cups_total`, `free_cups`, `days_operating`, `currency`, `revenue_last_week`,
`revenue_last_month`, `revenue_total`, `revenue_total_usd_approx`, `powder_g_total`.

Three fields carry a companion that says how much to trust them — surface it or
deliberately ignore it, but do not silently present a guess as a fact:

* **`country_source`** — `"machine"` (typed on the machine record), `"client"` (taken from
  the owning client), or `"timezone"` (**derived, can be wrong by a border** — the machine
  clock is set by hand and one unit in Miami reports `America/Toronto`).
* **`active_tastes_source`** — `"planogram"` means the containers that are switched on and
  not empty in Strapi. `"recent_sales"` means the machine is not on the portal catalogue at
  all, so the list is the flavours it has actually poured recently. The busiest machine in
  the fleet (397 drinks) is in the second category.
* **`days_operating`** — days since the **first transaction we hold**, which is bounded by
  how far back that machine's own CSV files go, not by how long it has been installed. One
  machine shows 6 days against 210 drinks. **Do not label this "days since installation".**

---

## 5. Money — read this before rendering a single number

**Two revenue figures are published per machine and per currency, and they are different
on purpose:**

* `revenue_total` — every dispensed cup valued at its price, with a free-mode cup valued at
  its **list price**. This is "count every cup we made as a cup we sold".
* `revenue_total_charged` — only what was actually billed.

The gap is the free-mode volume, and it is not small: fleet-wide `TRY 330` vs `TRY 0`
(both Turkish cups were free) and `ARS 18085` vs `ARS 4530`. **Pick one, label it, and use
the same one everywhere on the page.** Mixing them between a card and a total is the bug
this section exists to prevent.

`totals.revenue_usd_approx` is built from the `revenue_total` side.

**The USD total is approximate by construction.** `stats.fx.rates_to_usd` is a static
table on the backend, not a live feed — deliberately, because a rate API that fails inside
an hourly cron is worse than a slightly stale number. Label it "approx." in the UI.
A currency with no rate in the table is **excluded** from `revenue_usd_approx` and named in
`totals.unconverted_currencies` — if that array is non-empty, the total understates and the
UI should say so.

**`STARTING_REVENUE_USD = 19_780` in the old route:** that constant added a fixed offset to
the displayed lifetime revenue. Nothing in the new payload knows about it. If it represents
real pre-collection trade, add it explicitly in the frontend with a named constant and a
comment; if it was a placeholder, drop it. Do not port it by reflex.

---

## 6. Freshness and failure

* `stats.generated_at` is when the backend built the payload. It moves **once an hour**.
  Show it ("updated 14 min ago") — a fleet dashboard that looks live but is hourly invites
  the question "why hasn't this changed".
* Do not poll faster than the source updates. The component's existing
  `REFRESH_INTERVAL_MS = 60 * 60 * 1000` is exactly right; keep it.
* **Strapi restarts return 502 through the Cloudflare tunnel for roughly 20 seconds.** This
  is routine, not an incident. The stale-cache fallback in §1 covers it; do not render an
  error state on a single failed fetch.

---

## 7. `components/home/data.ts` — the hardcoded trio

```ts
export const stats: StatItem[] = [
  { label: "Machines sold",     value: "107"   },
  { label: "Countries covered", value: "17"    },
  { label: "Drinks made",       value: "2.5k+" },
];
```

"Drinks made" is now a real number (`totals.cups_total`). "Countries covered" is derivable
(`new Set(stats.machines.map(m => m.country).filter(Boolean)).size`) — but note it counts
countries **we have telemetry from**, currently far fewer than 17, so live-wiring it would
make the number go *down*.

Recommendation: wire "Drinks made" to `totals.cups_total`, leave the other two as
marketing copy, and add a comment saying which is which. Flag it rather than quietly
replacing a sales claim with a smaller measured one.

---

## Definition of done

1. `pages/api/public/fleet-stats.ts` exists, proxies `/api/statistic`, caches, serves stale on error.
2. `pages/api/public/recent-sales.ts` is deleted, along with its rate-fetching, vocabulary and page-walking helpers.
3. No live exchange-rate call remains in the frontend.
4. `Stats.tsx` renders from the new payload, with every nullable relation guarded.
5. A per-machine section renders `stats.machines[]`, with a decision made about the 24 zero-cup entries.
6. Revenue is labelled — which of the two figures, and "approx." on the USD total.
7. `generated_at` is visible somewhere.
8. Nothing in the client bundle carries a Strapi token: the endpoint is public and must stay unauthenticated.

## Do not

* Do not unmask or reconstruct serial numbers. `serial_masked` is the only form that leaves the backend.
* Do not add authentication to `/api/statistic` calls — it is public `find` only, and a token there would be a leak, not a safeguard.
* Do not compute revenue from `/api/sales`; that collection is **403 to the public** and must stay that way.
* Do not sum across currencies yourself. Use `revenue_by_currency` or `revenue_usd_approx`.
