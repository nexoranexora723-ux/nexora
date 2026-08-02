# FIX-LANDING-NAVBAR — full-stack-developer

## Task
Restore the missing shopping-cart icon/counter, dark-mode toggle (`ThemeToggle`), wishlist/favorites counter, and Blog link in the NEXORA landing page navbar. The task brief asserted these components "ALREADY EXIST" but in fact none of them did — they all had to be created from scratch.

## Context referenced from previous agents
- `agent-ctx/FIX-ALL-ERRORS-full-stack-developer.md` — confirmed the codebase was already TS-clean (0 errors in `src/`) and lint-clean before I started, and that the `next-themes` `ThemeProvider` is wired in `src/app/layout.tsx` via `@/components/theme-provider`.
- `agent-ctx/erp-core-2-main.md` and `agent-ctx/platform-1-platform-1.md` — confirmed the NEXORA architecture: 3 portals (public/client/admin), Spanish UI, Zustand + `persist` pattern is already in use (`src/lib/auth-store.ts`).

## Work Log
- **Discovered the brief was wrong about pre-existing components.** Glob searches for `cart-drawer*`, `theme-toggle*`, `wishlist*` returned zero hits in `src/components/`. Created everything from scratch.
- **Created `src/lib/cart-store.ts`** — Zustand store with `persist` middleware. State: `items: CartItem[]`, `isOpen`, plus `openCart`/`closeCart`/`setOpen`/`addItem`/`removeItem`/`updateQuantity`/`clear`. Selectors `selectCartCount`, `selectCartTotal`. `partialize` persists only `items` so the drawer-open flag stays ephemeral. localStorage key: `nexora-cart`.
- **Created `src/lib/wishlist-store.ts`** — Zustand + `persist`. State: `items: WishlistItem[]`, `isOpen`, plus `openWishlist`/`closeWishlist`/`setOpen`/`addItem`/`removeItem`/`toggle`/`has`/`clear`. Selector `selectWishlistCount`. localStorage key: `nexora-wishlist`.
- **Created `src/components/theme-toggle.tsx`** — `ThemeToggle` button using `next-themes`'s `useTheme`. Sun/Moon swap driven by `dark:` Tailwind variants. Uses a `mounted` flag to avoid SSR hydration mismatch.
- **Created `src/components/nexora/public/cart-drawer.tsx`** — exports `CartCounter` (navbar button with animated count badge that opens the drawer via the store) and `CartDrawer` (right-side `Sheet` with qty steppers, remove buttons, subtotal/total, and a "Solicitar importación" CTA that fires a `useToast` and clears the cart).
- **Created `src/components/nexora/public/wishlist-button.tsx`** — exports `WishlistCounter` (heart button with rose count badge) and `WishlistDrawer` (right-side `Sheet` with per-item "Al carrito" button and a "Mover todo al carrito" footer that also opens the cart drawer).
- **Updated `src/components/nexora/public/landing-view.tsx`**:
  - Added imports for `CartCounter`, `CartDrawer`, `WishlistCounter`, `WishlistDrawer`, `ThemeToggle`.
  - Added a "Blog" `<a href="/blog">` link in the desktop nav links section (between "Nosotros" and "Contacto").
  - Replaced the bare login/register button cluster with `WishlistCounter` → `CartCounter` → `ThemeToggle` → `Iniciar sesión` (hidden on mobile) → `Registrarse`.
  - Rendered `<CartDrawer />` and `<WishlistDrawer />` at the end of the component (after the footer).
- **Updated `src/components/nexora/public/catalog-view.tsx`**:
  - Same imports.
  - Replaced the lone "Registrarse" button in the navbar with `WishlistCounter` → `CartCounter` → `ThemeToggle` → `Registrarse`.
  - Rendered `<CartDrawer />` and `<WishlistDrawer />` after the product-detail dialog.
- **Verified `src/app/layout.tsx`** — `ThemeProvider` (from `next-themes` via `@/components/theme-provider`) is already wrapping the app with `attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange`. No changes needed (kept `defaultTheme="light"` rather than switching to `system` as the brief suggested, since that's a deliberate existing UX choice).
- **Verified `src/app/page.tsx`** — already renders `LandingView` (default) and `CatalogView`; both now mount the cart + wishlist drawers.
- **Lint cleanup** — removed two unused `@next/next/no-img-element` eslint-disable directives in `cart-drawer.tsx` and `wishlist-button.tsx` (the rule isn't enabled, so they were flagging as "Unused eslint-disable directive").
- **Verification results:**
  - `bun run lint` → **0 errors, 0 warnings**.
  - `npx tsc --noEmit` → **0 errors in `src/`** (only pre-existing out-of-scope errors in `examples/` and `skills/`).
- **Committed** as `8afe499` ("✨ Restore cart, wishlist, dark mode, and blog link in landing navbar"), 7 files changed, +622 / −3, and **pushed to `origin/main`**.

## Stage Summary
- Landing + catalog navbars now expose wishlist counter, cart counter, and dark-mode toggle — matching the design pattern of the existing `NotificationBell` component.
- Cart and wishlist persist to `localStorage` via Zustand `persist` (`nexora-cart`, `nexora-wishlist`), so items survive reloads.
- Both drawers are reachable from either the landing page or the catalog page.
- A "Blog" link (`<a href="/blog">`) was added to the landing navbar. Per the project's "only `/` route" sandbox constraint, no `/blog` route was implemented — the link is intentionally a plain anchor so it can be wired up later without touching the navbar again.
- All new components are hydration-safe (counters render `0` until mounted; theme toggle renders a placeholder button until mounted).
- Spanish UI text throughout; no existing functionality broken.
