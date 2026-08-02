# RedSportPe Frontend — Project Context

## What this is
E-commerce frontend for RedSport, a Peruvian sportswear brand. Angular 21, SCSS, standalone components, signals. Spanish UI, English code.

## Architecture: DDD-lite by bounded contexts
Folders under `src/app/` map to bounded contexts from our event storming:
- `catalog/` — products, variants, filters, search, detail page, favorites (customer DONE); admin: product management at /admin/productos (list, create/edit with variant editor + auto-SKU, publish toggle, delete) and inventory at /admin/inventario (per-SKU stock editing in DRAFT mode — nothing hits the catalog until "Guardar cambios"; "Descartar" reverts; low/out-of-stock counters) (DONE)
- `orders/` — cart with drawer, checkout (delivery data → QR payment → confirmation), unpaid-orders section in cart, "Mis pedidos" at /pedidos with 4-dot tracking (DONE); admin: all orders at /admin/pedidos with payment status (Pagado/QR activo/QR vencido) and "Avanzar estado" driving the tracking (DONE)
- `promotions/` — public name "Promos": discounted products page at /promos with catalog-style filters and promo-price sorting (DONE); admin: discount form + promo list with states at /admin/descuentos (DONE)
- `identity/` — IAM: auth modal (login/register/Google) overlaid from store-layout on any page, account page at /cuenta with RedSport points and saved delivery info, roles customer|admin with adminGuard on /admin/* (simulated in AuthRepository; real Google Identity Services + backend auth pending). Demo admin: admin@redsport.pe / admin123.
- `layout/` — store-layout (top navbar) and admin-layout (sidebar)
- Future contexts: inventory, payments, shipping, notifications, marketing

Each context has: `domain/` (models + business rule functions), `application/` (signal stores), `infrastructure/` (repositories), `presentation/` (pages + components).

Full tactical DDD (aggregates, entities, VOs) is reserved for the BACKEND (not built yet). Frontend stays DDD-lite: don't add aggregate classes here.

## Key domain rules
- SKU format: RS-[PRODUCT]-[GENDER]-[SIZE]-[COLOR], e.g. RS-CJCN-H-S-NEG.
  Gender codes: H (hombre), M (mujer), U (unisex adulto), NO (niño), NA (niña).
  Color codes in COLOR_LABELS (product-filtering.ts). Sizes: 8-16 kids, S-XXL adults (SIZE_ORDER).
- SKU is the Published Language: cart items, orders, inventory all reference variants by SKU.
- Product vs Variant: customers browse products; stock/cart/orders operate on variants.
- Relevance sorting: salesCount desc, tie-break by lower price.
- Filters derive from actual product data (categories, colors, sizes appear/disappear automatically).
- Favorites (catalog): NO anonymous favorites — hearting without a session opens the auth modal. In-memory Set in CatalogStore (account-linked persistence comes with the backend). Heart on product cards and detail page, /favoritos page lists them, "Favoritos" card in /cuenta links there with a count.
- Admin (vista, not a separate context — each context owns its admin side): only role 'admin' enters /admin/* (adminGuard). CatalogStore is cache-first and holds ALL products; customers see only published ones. A product cannot be deleted while it has active (undelivered) orders — productHasActiveOrders in orders/domain, enforced by the admin page. Admin catalog mutations are in-memory until the backend.
- SKU helpers (sku.value-object.ts): isValidSku/buildSku with the REAL codes (H/M/U/NO/NA, kids sizes) — the admin variant editor autogenerates SKUs with buildSku.
- Cart: one line per SKU, quantity capped by variant stock. In-memory only for now: `saveToSession()` exists in CartStore but is intentionally not wired up — persistence will be revisited when the backend lands. Drawer has no backdrop by design: it stays open while browsing and only closes via ✕.
- RedSport points (loyalty): 1 sol = 1 point, DECIMALS INCLUDED (S/ 150.99 → 150.99 points, redsport-points.ts). Credited the moment an order is PAID. No refunds: paid points never return, even if the order is cancelled.
- Checkout (orders): requires session (opens auth modal otherwise). Methods: motorizado (delivery) or Shalom (agency pickup). Payment: QR (Yape/Plin, simulated) valid 8 HOURS; expired/postponed orders appear under the cart as "Pedidos no pagados" (pay with a fresh QR or delete). 3PM CUTOFF: motorizado paid before 3pm delivers tomorrow, after 3pm the day after; Shalom paid before 3pm is dropped at the agency same day, after 3pm next day (delivery-rules.ts).
- Order tracking (order-tracking.ts): 4-dot timeline per method — motorizado: Preparando → Despachado → En camino → Entregado; shalom: Almacén → En agencia → En tránsito → En destino. Button says "Consultar" on first query of a login session, then "Actualizar pedido" (resets on logout). Simulation advances one step per query until the backend/Shalom API lands.
- Orders persist in sessionStorage (redsport_orders, per userId) — unlike the cart, "Mis pedidos" needs it.
- Delivery info (identity, delivery-info.model.ts): saved to the profile on the FIRST checkout, shown/editable in the "Datos de entrega" card at /cuenta, and prefilled on later checkouts.
- Auth: session is in-memory like the cart (lost on reload — by design until backend). Unauthenticated navbar shows "Iniciar sesión" + red "Registrarse"; authenticated shows "Mi cuenta". AuthRepository simulates register/login/Google with fake latency.
- Promotions: admin subtracts a fixed amount in soles from the regular price (139 - 39 = 100). Optional endsAt (inclusive: promo lives through that whole day) and optional maxUnits/unitsSold cap ("10 of 22"). A promo is active when neither expired nor depleted (promotion-rules.ts). ONE active promo per product (enforced by the admin form). Product detail shows the promo price and the cart snapshots it as unitPrice. unitsSold accounting is the backend's job.
- PromotionsStore is cache-first and joins against CatalogStore's products (single source of truth — admin-created products/promos survive navigation). Admin mutations (promos, stock, orders' tracking) are in-memory/sessionStorage until the backend.
- Data source: `public/data/products.json` via CatalogRepository (HttpClient); promos in `public/data/promotions.json` via PromotionsRepository. Will be swapped for the real API by changing only the repositories.

## Conventions
- Conventional commits: feat(catalog):, fix(orders):, style:, refactor:, chore:, docs:
- Branch flow: feature/* → develop → main. Personal branches may force-push; develop/main never.
- Git remote uses SSH alias `github-cueto` (NOT github.com) — dual GitHub account setup.
- UI text in Spanish, code in English. Brand tokens in styles.scss (--rs-red, --rs-surface, Oswald + Inter fonts).

## Current state / next steps
- Done: full customer side (catalog, promos, favorites, cart+checkout+QR, mis pedidos, cuenta with points/delivery info) and the full admin panel behind adminGuard: Productos, Inventario, Pedidos and Descuentos, all in the admin-layout sidebar.
- Known issue: 8 CLI-generated component specs fail (missing HttpClient/Router providers in TestBed) — pre-existing, fix pattern in promos-page.spec.ts.
- Next candidates: starting the backend (10 bounded contexts from event storming, stack TBD), payment verification flow (operation number + "Verificando pago" state), or deploy to Hostinger.
- Deploy target: Hostinger. Domain + SSL already purchased.
