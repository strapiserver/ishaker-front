# Telemetry sales endpoint mappings (for the pending sales integration)

Source of truth = the Python telemetry client `tools/mcp-telemetry/client.py`.
Base API: `https://manage.ishakerusa.com/api`. Auth = Keycloak password grant
(realm `shaker-realm`, client `shaker-client`). **The frontend already implements all of
this** in `services/server/telemetryClient.ts` (`telemetryFetch`, token cache/refresh, org
resolution). Just add three functions there — do NOT reimplement auth.

## The three endpoints (all ORG-scoped, GET)
| client fn | HTTP | notes |
|-----------|------|-------|
| `get_sales(org_id, page=0, limit=20)` | `GET /telemetry-sale/sale/list/{org_id}?page={page}&limit={limit}` | paginated list |
| `get_sales_stats(org_id)`             | `GET /telemetry-sale/sale-period/all/{org_id}` | day/week/month totals |
| `get_sales_qty(org_id)`               | `GET /telemetry-sale/sale/qty/{org_id}` | lifetime count |

## Response shapes
```
get_sales        -> { data: [{ id, date, amount, product, machine, ... }],
                      pagination: { page, qty, limit } }
get_sales_qty    -> { qty: number }
get_sales_stats  -> LIVE (2026-07-17, empty org): { day: number, week: number, month: number }
                    README documents: { day:{qty,amount}, week:{qty,amount}, month:{qty,amount} }
```
**Discrepancy — code defensively.** Every org I probed returns 0/empty right now (no sales in the
system yet), so the live populated shape of `get_sales` records and of `get_sales_stats` could not
be observed. The live `get_sales_stats` returned FLAT scalars `{day:0,week:0,month:0}`, not the
nested `{qty,amount}` the README claims. Handle both: `typeof v === 'number' ? v : v?.amount`.

## Org scoping (important)
All three take an **organization id**, not a machine id. The front already resolves it:
`resolveTelemetryOrganizationId({ company, telemetry_organization_id })` and
`resolveTelemetryMachine(...)` (returns `organizationId`). `pages/machines/[id].tsx` already
receives `telemetryOrganizationId` in props.
- `get_sales_stats` / `get_sales_qty` = **org totals only**, cannot be filtered by machine.
- `get_sales` records carry a `machine` field, so for a single-machine sales view you must
  **filter the list client-side by machine** (serial/id) — the endpoint itself won't scope it.

## Code to add (services/server/telemetryClient.ts) — mirror existing exports
```ts
export const getTelemetrySales = (organizationId: number, page = 0, limit = 20) =>
  telemetryFetch<any>(`/telemetry-sale/sale/list/${organizationId}?page=${page}&limit=${limit}`);

export const getTelemetrySalesStats = (organizationId: number) =>
  telemetryFetch<any>(`/telemetry-sale/sale-period/all/${organizationId}`);

export const getTelemetrySalesQty = (organizationId: number) =>
  telemetryFetch<any>(`/telemetry-sale/sale/qty/${organizationId}`);
```
Call them from `getServerSideProps` (server-side only — telemetry creds never reach the browser),
using the `telemetryOrganizationId` the page already resolves.
