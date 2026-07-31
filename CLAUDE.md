# RedSportPe Frontend — Project Context

## What this is
E-commerce frontend for RedSport, a Peruvian sportswear brand. Angular 21, SCSS, standalone components, signals. Spanish UI, English code.

## Architecture: DDD-lite by bounded contexts
Folders under `src/app/` map to bounded contexts from our event storming:
- `catalog/` — products, variants, filters, search, detail page (DONE)
- `orders/` — cart with drawer (DONE); checkout pending
- `promotions/` — public name "Promos": discounted products page at /promos (customer side DONE; admin discount form pending)
- `identity/` — IAM: Google login for customers, internal roles (PENDING)
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
- Cart: one line per SKU, quantity capped by variant stock. In-memory only for now: `saveToSession()` exists in CartStore but is intentionally not wired up — persistence will be revisited when the backend lands. Drawer has no backdrop by design: it stays open while browsing and only closes via ✕.
- Promotions: admin subtracts a fixed amount in soles from the regular price (139 - 39 = 100). Optional endsAt (inclusive: promo lives through that whole day) and optional maxUnits/unitsSold cap ("10 of 22"). A promo is active when neither expired nor depleted (promotion-rules.ts). Product detail shows the promo price and the cart snapshots it as unitPrice. unitsSold accounting is the backend's job.
- Data source: `public/data/products.json` via CatalogRepository (HttpClient); promos in `public/data/promotions.json` via PromotionsRepository. Will be swapped for the real API by changing only the repositories.

## Conventions
- Conventional commits: feat(catalog):, fix(orders):, style:, refactor:, chore:, docs:
- Branch flow: feature/* → develop → main. Personal branches may force-push; develop/main never.
- Git remote uses SSH alias `github-cueto` (NOT github.com) — dual GitHub account setup.
- UI text in Spanish, code in English. Brand tokens in styles.scss (--rs-red, --rs-surface, Oswald + Inter fonts).

## Current state / next steps
- Done: catalog context complete, home sections (trends carousel, novedades, WhatsApp club, membership), cart with drawer, Promos customer page (/promos, navbar link right of Catálogo).
- Known issue: 8 CLI-generated component specs fail (missing HttpClient/Router providers in TestBed) — pre-existing, fix pattern in promos-page.spec.ts.
- Next candidates: feature/auth (IAM, Google login), admin promotions form, or starting the backend (10 bounded contexts from event storming, stack TBD).
- Deploy target: Hostinger. Domain + SSL already purchased.
