# ضحكة طفل

Run `npm run dev` (Python 3) from this directory. Open port 3000 in a development browser.

## Architecture
- `src/data/products.js`: local catalog and integer prices in hundredths of JOD. Imported from supplied advertising images; verify descriptions, current prices, variants, and inventory before launch. `available` currently enables a draft selection, not verified stock.
- `src/services/products.js`: asynchronous catalog boundary. Replace its implementation with an API client when adding a backend; keep product IDs stable.
- `src/cart/cart.js`: local cart persistence and quantity rules.
- `src/checkout/checkout.js`: WhatsApp order handoff with encoded cart details. Customer sends the message and confirms availability with the store; no online payment.
- `src/app.js`: storefront presentation.

A future admin dashboard can edit products through an authenticated backend API. The storefront uses the same product service interface. Keep authentication, authorization, inventory validation and authoritative order pricing on that backend. No admin functionality or database is implemented now.

57 original images are retained in assets/products. Repeated images 0030 and 0045 are omitted from catalog listing. Orders open WhatsApp at +962790782290. Shipping is free at 10 JOD or more; below that threshold the store confirms delivery fees. Store contact and shipping settings are centralized in src/data/store.js.
