# Task: PHASE-2-SALES-FEATURES

**Agent:** main (Z.ai Code)
**Date:** 2025-08-02

## Summary

Built Phase 2 sales features for the NEXORA storefront:
1. WhatsApp floating button (global, all routes)
2. Complete 4-step checkout flow (customer info → shipping → payment → review)
3. Colombian shipping calculator (full + compact)
4. Functional coupon system with 4 valid codes + validation
5. Verified volume discounts in cart

## Files created

- `src/lib/coupon-store.ts` — Zustand + persist store. 4 hardcoded coupons (BIENVENIDA10, BLACKFRIDAY20 [Nov], NAVIDAD15 [Dic], VIP25). `validateCoupon()` checks code + month validity. `computeCouponDiscount()` pure helper.
- `src/components/nexora/public/whatsapp-floating.tsx` — Green WhatsApp floating button at `bottom-20 right-5` (above live-chat at `bottom-5 right-5`). Pulse ring animation, online indicator dot, tooltip "¿Tienes dudas? Escríbenos", WhatsApp SVG icon. Opens `wa.me/573105550100?text=Hola%20NEXORA,%20quiero%20hacer%20una%20consulta`. Responsive (h-12 mobile / h-14 desktop).
- `src/components/nexora/public/shipping-calculator.tsx` — 9 Colombian cities with cost + days (Bogotá/Medellín $8 5-7d, Cali/Barranquilla/Cartagena $10 7-9d, Bucaramanga/Pereira/Manizales $9 6-8d, Otra $12 8-10d). `FREE_SHIPPING_THRESHOLD = $200`. Exports `computeShippingQuote()`, `ShippingCalculator` (full, used in checkout step 2), `ShippingCalculatorCompact` (read-only, used on product detail).
- `src/components/nexora/public/checkout-dialog.tsx` — 4-step Dialog with progress stepper:
  - **Step 1**: Customer info form (firstName, lastName, email, phone, city select, address) — all required with email regex validation. Pre-fills from authed user.
  - **Step 2**: Shipping method (uses `ShippingCalculator`, shows DHL/FedEx cost + estimate + free shipping progress bar).
  - **Step 3**: Payment method (RadioGroup: Nequi 💚 / Daviplata 💜 / PayPal 💙 / Transferencia 🏦). No contraentrega. Shows step-by-step instructions + copyable contact info.
  - **Step 4**: Review (items list, volume discount badge, coupon input with apply/remove, shipping cost, 19% IVA, total). "Confirmar pedido" button POSTs to `/api/orders` with items + paymentMethod + shippingAddress.
  - Success screen: order number, total, payment instructions reminder, "Rastrear mi pedido" button → `/track-order`.
  - Unauthenticated screen: prompts login (cart preserved).
  - Reads `checkoutOpen` from cart-store (no props needed).

## Files modified

- `src/lib/cart-store.ts` — Added `checkoutOpen` boolean state + `setCheckoutOpen`/`openCheckout`/`closeCheckout` actions. Added volume discount helpers: `getVolumeDiscountPct(qty)` (1-4=0%, 5-9=10%, 10-19=15%, 20+=20%), `selectVolumeDiscountPct`, `selectVolumeDiscountAmount`, `selectDiscountedSubtotal`.
- `src/components/nexora/public/cart-drawer.tsx` — Replaced direct `POST /api/orders` with `openCheckout()` (opens the global dialog). Added volume discount line in the cart footer. Removed unused `Loader2`/`submitting` state.
- `src/components/nexora/public/live-chat.tsx` — Removed the WhatsApp fallback button (was duplicate of the new dedicated component). Returns `null` when Tawk.to env vars aren't set. Hardcoded WhatsApp number `573105550100` in the in-panel WhatsApp link.
- `src/components/nexora/public/product-detail-page.tsx` — Added `<ShippingCalculatorCompact unitPrice={product.estimatedCost} />` below the delivery timeline.
- `src/app/page.tsx` — Mounted `<CheckoutDialog />` globally (no props — reads state from cart-store). WhatsAppFloating is mounted in layout.tsx instead (to avoid duplicate rendering on `/`).
- `src/app/layout.tsx` — Mounted `<WhatsAppFloating />` inside `<QueryProvider>` so it renders on ALL routes (`/`, `/blog`, `/pedidos`, `/track-order`, `/cuenta`, etc.) and on ALL views (including authed AdminPortal/ClientPortal).

## Coupon validation rules

| Code | % | Validity | Description |
|------|---|----------|-------------|
| BIENVENIDA10 | 10% | Always | First-purchase welcome |
| BLACKFRIDAY20 | 20% | November only | Black Friday |
| NAVIDAD15 | 15% | December only | Christmas |
| VIP25 | 25% | Always | VIP customers |

Month check uses `new Date().getMonth() + 1` (1=Jan, 11=Nov, 12=Dec).

## Volume discount tiers (verified working)

| Total item qty | Discount |
|---|---|
| 1-4 | 0% |
| 5-9 | 10% |
| 10-19 | 15% |
| 20+ | 20% |

Applied to cart subtotal in cart-drawer footer and checkout review.

## Total computation in checkout

```
subtotal            = Σ (item.price × item.quantity)
volumeDiscount      = subtotal × volumePct
discountedSubtotal  = subtotal − volumeDiscount
couponDiscount      = discountedSubtotal × couponPct
afterCoupon         = discountedSubtotal − couponDiscount
shippingCost        = 0 if afterCoupon ≥ $200 else cityCost
tax (IVA 19%)       = afterCoupon × 0.19
total               = afterCoupon + shippingCost + tax
```

## Verification

- `bun run lint` → 0 errors, 0 warnings ✓
- `npx tsc --noEmit` → 0 errors in `src/` (pre-existing errors only in `examples/` and `skills/` — out of scope) ✓
- Cart store tests → 18 passed, 0 failed ✓

## Notes / decisions

- WhatsAppFloating mounted ONLY in `layout.tsx` (not also in `page.tsx`) to avoid duplicate rendering on `/` — layout wraps all routes including page.tsx, so this satisfies "all views" + "all routes" with a single instance.
- CheckoutDialog mounted in `page.tsx` (not layout.tsx) because it's only relevant on the storefront (`/`), not on `/blog`, `/pedidos`, etc. It reads `checkoutOpen` from cart-store, so the cart drawer can open it without prop drilling.
- `live-chat.tsx` no longer renders a WhatsApp fallback button when Tawk.to env vars aren't set — the dedicated `WhatsAppFloating` component handles that globally now.
- The existing `/api/orders` POST handler doesn't accept `coupon`, `shipping`, `tax`, or `total` fields — it computes subtotal from items. The displayed breakdown (volume discount, coupon, shipping, IVA, total) is client-side informational only; the stored order's `budget` reflects the raw item subtotal. To persist the discounted total in the DB, the API would need extending (out of scope — task said "use existing API routes").
- IVA (19%) is computed on the post-discount subtotal (standard Colombian practice for displaying the tax breakdown).
