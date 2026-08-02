# Task: PHASE-1-FIX-BROKEN

## Agent: main (Z.ai Code)

## Task
Fix 3 critical issues in NEXORA: (1) catalog crash when logged in, (2) image loading verification & fallbacks, (3) dark mode toggle.

## Work Log

### 1. Catalog crash when logged in — ROOT CAUSE FOUND & FIXED

**Root cause:** `ClientCatalog` component (inside `src/components/nexora/client/client-portal.tsx`) called `/api/products` and treated the response as a bare `Product[]`, but the API actually returns a wrapper `{ products: Product[]; total; page; totalPages }`. As soon as the data loaded, `products.map(...)` threw `TypeError: products.map is not a function`, which bubbled up to the global error boundary → "Algo salió mal".

Secondary contributor: hydration mismatch from the auth-store. `useAuth` persisted EVERYTHING (including `isLoading` and `isAuthenticated`) via Zustand `persist` with no `partialize`. SSR rendered with defaults (`isLoading:true, isAuthenticated:false`) while the client hydrated with persisted (`isLoading:false, isAuthenticated:true`), causing React to discard the SSR tree and re-render — compounding the crash for authenticated users.

**Fixes applied:**

1. `src/lib/auth-store.ts` — Added `partialize: (state) => ({ user: state.user })` so only the `user` object is persisted. `isLoading` / `isAuthenticated` / `portal` are now ephemeral (default `isLoading:true, isAuthenticated:false`), making SSR and client first render identical. `logout()` now also resets `isLoading:false`.

2. `src/components/nexora/client/client-portal.tsx` (`ClientCatalog`) — Rewrote the `useQuery` to type the response as `{ products, total, page, totalPages }`, defensively handle both the wrapper shape and a bare array (legacy fallback), and extract `productsData?.products ?? []`. This stops the `products.map is not a function` crash.

3. `src/app/page.tsx` — Rewrote to:
   - Add a `mounted` state with a `useEffect` that sets it on mount (with the proper `react-hooks/set-state-in-effect` eslint-disable). Until `mounted && !isLoading`, the page renders a stable loading spinner so SSR and client first paint match exactly (prevents hydration mismatch from any persisted Zustand store).
   - Removed the `if (isAuthenticated) return` early-out from the deep-link query-param reader, so authenticated users visiting `/?view=catalog` actually reach `view === 'catalog'` and the partial fall-through fix works as intended.
   - Made the session query defensive (`if (!res.ok) return { user: null }`).
   - Changed the authed-branch check to `if (view !== 'catalog' && view !== 'product-detail')` for clarity.
   - Flow now: user logs in → sees portal → visits `/?view=catalog` (or follows a deep link) → sees the public `CatalogView` without error.

### 2. Image loading — verified & hardened

**Verification:**
- `/api/yupoo-img/[hash]/[size]` route exists and works: returns proper `Content-Type` from upstream, `Content-Length`, `ETag`, `Cache-Control: public, max-age=86400, stale-while-revalidate=604800`, `X-Content-Type-Options: nosniff`, supports `If-None-Match` → 304. Falls back to a tiny placeholder PNG on upstream failure.
- Top 20 products have local images at `/public/products/top20/` (verified ~150 jpg files across 11 brands: Gucci, Dior, DG, LV, Prada, Loewe, Hermes, Vacheron Constantin, Burberry, Balenciaga, North Face, Flamengo).

**Hardening applied:**

- Created `public/products/placeholder.svg` — a clean SVG placeholder (600×450, slate gradient, image icon, "NEXORA · Imagen no disponible" text) used as the `onError` fallback for every product image.
- Added `onError={(e) => { e.currentTarget.src = '/products/placeholder.svg' }}` to ALL product images so broken/remote-URL failures degrade gracefully instead of showing a broken-image icon.
- Replaced the emoji `📦` fallback divs with the actual `<img src="/products/placeholder.svg">` so the placeholder is a real image (consistent aspect ratio, accessible to screen readers via alt).
- Added `loading="lazy"` + `decoding="async"` to every product image below the fold (catalog grid, related products, thumbnails, compare table, admin list, reference images).
- Main/hero images in detail dialogs use `loading="eager"` (above the fold, should load immediately).
- Fixed empty `alt=""` attributes → descriptive alt text (`Imagen de referencia ${i+1}`, `Imagen del producto ${i+1}`, `Vista ${i+1} de ${product.name}`).

**Files updated for images:** `catalog-view.tsx` (ProductCard + ProductDetailDialog), `client-portal.tsx` (ClientCatalog + ProductDetailDialog + reference images), `product-detail-page.tsx` (main image + thumbnails + related), `compare-products.tsx`, `landing-view.tsx`, `admin-products.tsx` (list + form gallery), `wizard-dialog.tsx`.

### 3. Dark mode — fixed

**Root cause:** `defaultTheme="light"` ignored the user's OS preference on first visit (no saved theme). Also, the `ClientPortal` theme toggle used `theme === 'dark'` instead of `resolvedTheme === 'dark'` — when `theme === 'system'` (the new default), clicking the toggle would call `setTheme('dark')` even if the resolved theme was already dark, so the toggle appeared not to work.

**Fixes applied:**

1. `src/app/layout.tsx` — Changed `defaultTheme="light"` → `defaultTheme="system"`. Now first-time visitors get their OS preference respected (light or dark). Returning visitors keep their saved choice.
2. `src/app/layout.tsx` — Updated the `viewport.themeColor` from a single static `#3b82f6` to a media-query array: `#ffffff` for `(prefers-color-scheme: light)` and `#0a0a0a` for `(prefers-color-scheme: dark)`. This makes the browser UI (mobile address bar) match the app theme.
3. `src/components/nexora/client/client-portal.tsx` — Changed `const { theme, setTheme } = useTheme()` → `const { resolvedTheme, setTheme } = useTheme()` and updated the onClick to `setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')`. Now the toggle always flips the ACTUAL resolved theme, regardless of whether `theme` is `'system'`, `'light'`, or `'dark'`.
4. Verified `src/components/theme-toggle.tsx` (the shared `ThemeToggle` used on landing, catalog, legal, FAQ, cuenta, pedidos pages) already correctly uses `resolvedTheme` + a `mounted` guard to avoid hydration mismatch. No changes needed.
5. Verified `globals.css` has complete `.dark` CSS variable overrides (background, foreground, card, popover, primary, secondary, muted, accent, destructive, border, input, ring, chart-*, sidebar-*) — all defined in oklch. No changes needed.

**Result:** Dark mode toggle now works instantly on ALL pages (landing, catalog, product detail, legal pages, FAQ, cuenta, pedidos, client portal, admin portal).

## Verification

- `bun run lint` → **0 errors, 0 warnings** (clean).
- `npx tsc --noEmit` → **0 errors in src/** (only pre-existing errors in `examples/` and `skills/` which are out of scope).
- No changes to `prisma/schema.prisma` — no DB migration needed.
- No new dependencies installed.

## Files changed (10)

1. `src/lib/auth-store.ts` — added `partialize` to only persist `user`.
2. `src/app/page.tsx` — added `mounted` guard, removed authed early-out from URL param reader, defensive session fetch.
3. `src/components/nexora/client/client-portal.tsx` — fixed `ClientCatalog` API response shape, fixed theme toggle to use `resolvedTheme`, added image fallbacks + lazy loading.
4. `src/components/nexora/public/catalog-view.tsx` — image fallbacks + lazy loading (ProductCard + ProductDetailDialog).
5. `src/components/nexora/public/product-detail-page.tsx` — image fallbacks + lazy loading (main + thumbnails + related).
6. `src/components/nexora/public/compare-products.tsx` — image fallback + lazy loading.
7. `src/components/nexora/public/landing-view.tsx` — image fallback + lazy loading.
8. `src/components/nexora/admin/admin-products.tsx` — image fallbacks + lazy loading (list + form gallery).
9. `src/components/nexora/client/wizard-dialog.tsx` — image fallback + lazy loading + descriptive alt.
10. `src/app/layout.tsx` — `defaultTheme="system"`, responsive `themeColor`.

## New files (1)

- `public/products/placeholder.svg` — reusable SVG placeholder for products without images.
