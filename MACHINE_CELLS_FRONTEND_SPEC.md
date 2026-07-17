# Frontend spec — Container → Product assignment (machine cells)

## Goal
Let a portal client decide **which product sits in each physical powder container** of one
of their machines. This is the on-screen assortment (what the kiosk actually sells), distinct
from the product *catalog* (the database of products they authored).

## Backend (already done on dev Strapi :1337; promote to prod via deploy-strapi.sh)
New collection type **`machine-cell`**:
| field          | type                                   | meaning |
|----------------|----------------------------------------|---------|
| `machine`      | relation m2o -> machine (machine.cells)| owner machine |
| `position`     | integer (required)                     | physical container number |
| `product`      | relation o2o -> product (nullable)     | assigned product; null = empty slot |
| `isActive`     | boolean (default true)                 | slot enabled for sale |
| `cell_category`| enum `powder` \| `concentrate`         | physical slot type (guard) |

Permissions: Authenticated role has CRUD (data-side). **Rows are SEEDED by ops**
(`seed_machine_cells.py`) from the machine's real config.json — the frontend never invents
positions; it lists existing rows and lets the client change `product` / `isActive`.
After a save, the machine reflects it within ~3 min (FleetPulse runs `sync_machine_cells.py`,
which treats machine-cell rows as authoritative, with a never-wipe guard for catalog lag).

## What to build

### 1. API proxy route (server-side, ownership-enforced) — mirror `pages/api/portal/product-lines/[id].ts`
`pages/api/portal/machines/[id]/cells.ts` with `getPortalSessionFromApiRequest` +
`requestStrapiRestAsService` (services/server/strapiClient).

- **Ownership**: `const allowed = new Set(session.machines.map(m => String(m.id)));`
  reject if `!allowed.has(machineId)` -> 403. (session.machines already lists the client's machines.)
- **GET** -> list this machine's cells, sorted:
  `/api/machine-cells?filters[machine][id][$eq]=${machineId}&populate[product][populate][taste]=*&sort[0]=position:asc&pagination[pageSize]=200`
- **PUT** body `{ assignments: [{ position:number, productId:number|null, isActive:boolean }] }`:
  1. Load existing rows for the machine (as above) -> map by position.
  2. For each assignment whose `position` EXISTS as a row: `PUT /api/machine-cells/{id}`
     with `{ data: { product: productId, isActive } }`. Ignore/return 400 for unknown positions
     (never create new positions from the client — those come from seeding).
  3. Validate every non-null `productId` is in the machine's catalog (see #2); else 400.
  4. Optional guard: `cell_category` of the row must match product.product_type; else 400.
  5. Return the refreshed list.

### 2. Catalog-products source for the dropdown
The dropdown must offer only products this machine can actually vend = the machine's effective
catalog: `machine.product_lines` products if any, else the products of the client's active
(non-template) product-lines. Add `pages/api/portal/machines/[id]/catalog-products.ts` (GET)
returning `[{ id, name, product_type, taste:{name} }]`. Scope by ownership the same way.
(Reuse the scoping logic already in the Strapi `machine.catalog` controller as reference.)

### 3. UI — new tab/section on `pages/machines/[id].tsx` (Chakra UI, like the rest)
Add a "Containers / Assortment" section (or subpage `pages/machines/[id]/cells.tsx`).
- `getServerSideProps`: `requirePortalSession`, verify machine belongs to session, fetch cells
  + catalog products server-side (call the helpers from #1/#2 or the service client directly).
- Render a table sorted by `position`, one row per cell:
  - **Position** (read-only) · **Category** badge (powder/concentrate)
  - **Product** = `<Select>`: options = catalog products (label = taste/name), plus an
    "— Empty —" option (productId null)
  - **Active** = `<Switch>` bound to isActive
- Client-side validation before save: no duplicate product across two **active** cells;
  warn if product_type ≠ cell_category.
- **Save** -> `PUT /api/portal/machines/${id}/cells` with the assignments array; toast result.
- **Empty state**: if GET returns `[]`, show "This machine's containers aren't initialized yet —
  contact ops" (seeding is a backend step, not self-serve).

### 4. Types (types/portal.ts or types/strapi.ts)
`PortalMachineCell = { id:number; position:number; isActive:boolean; cell_category:'powder'|'concentrate'|null; product:{ id:number; name:string; product_type:string; taste?:{name:string} } | null }`

## Rules / gotchas
- Never let the client create or delete positions — only edit `product`/`isActive` on seeded rows.
- Ownership is enforced **server-side** in the API route (browser holds no Strapi token; it calls
  same-origin `/api/portal/...`). Do NOT call Strapi REST from the browser.
- A product assigned but not yet in the machine's live DB is handled by the backend guard
  (cell left untouched until the catalog syncs) — the UI just needs to save the intent.
- Slot count varies by machine; render exactly the rows returned, don't hardcode N.
