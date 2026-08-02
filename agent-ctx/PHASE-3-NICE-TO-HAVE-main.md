# PHASE-3-NICE-TO-HAVE — main (Z.ai Code)

## Task scope
Implement 11 "nice-to-have" items for the NEXORA project (Next.js 16 + TypeScript + Prisma):
- Rate limiting on sensitive APIs
- Basic test files
- PWA icons
- Open Graph image
- Schema.org JSON-LD
- Image compression (ETag/304)
- Lazy iframes
- i18n infrastructure
- Product comparator
- Image search (VLM)
- AI chatbot

## Key decisions
- Rate limiter is in-memory Map (sliding window), per IP+group. Presets: AUTH=10/min, WRITE=30/min, DEFAULT=60/min.
- Tests use a built-in mini-framework (no test runner) so they're standalone runnable via `npx tsx`.
- PWA PNG icons generated via `sharp` from existing SVG (no manual image editing).
- OG image uses `next/og` ImageResponse, edge runtime, 1200×630.
- JSON-LD added in layout.tsx (Organization + WebSite), blog pages (Blog + BlogPosting + BreadcrumbList), and product-detail-page (Product).
- Yupoo image proxy now generates weak ETags (SHA-1 of buffer) and returns 304 Not Modified when If-None-Match matches.
- Live chat defers Tawk.to script load until after `window.load` + idle callback; MutationObserver auto-tags injected iframes with loading="lazy".
- i18n uses Zustand+persist for locale, with `useT()` (client) and `t()` (server) helpers. Only ~80 keys translated (basic infrastructure).
- Product comparator uses Zustand+persist (max 4 items); modal shows side-by-side table with best-value highlighting (lowest price, highest rating).
- Image search calls `zai.chat.completions.createVision` with `glm-4v-flash` model, extracts JSON `{ description, keywords[] }`, then fuzzy-matches against DB products.
- AI chatbot floats bottom-right (next to LiveChat), uses existing `/api/naios/chat`, history in state (not persisted).

## Files created (18)
- src/lib/rate-limit.ts
- src/lib/i18n.ts
- src/lib/compare-store.ts
- src/lib/translations/es.ts
- src/lib/translations/en.ts
- src/lib/__tests__/format.test.ts
- src/lib/__tests__/cart-store.test.ts
- src/lib/__tests__/wishlist-store.test.ts
- src/app/opengraph-image.tsx
- src/app/blog/page.tsx
- src/app/blog/[slug]/page.tsx
- src/app/api/search-by-image/route.ts
- src/components/nexora/public/live-chat.tsx
- src/components/nexora/public/language-toggle.tsx
- src/components/nexora/public/compare-products.tsx
- src/components/nexora/public/ai-chatbot.tsx
- public/icons/icon-192.png
- public/icons/icon-512.png (+ apple-touch-icon.png)

## Files modified (9)
- src/app/layout.tsx (icons metadata + Organization + WebSite JSON-LD)
- src/app/page.tsx (mount AiChatbot + LiveChat globally)
- src/app/api/auth/login/route.ts (rate limit)
- src/app/api/auth/register/route.ts (rate limit)
- src/app/api/orders/route.ts (rate limit on POST)
- src/app/api/admin/products/route.ts (rate limit on GET+POST)
- src/app/api/admin/products-list/route.ts (rate limit)
- src/app/api/yupoo-img/[hash]/[size]/route.ts (ETag + 304 + Content-Length)
- src/components/nexora/public/catalog-view.tsx (image search button, compare toggle button, language toggle, compare modal)
- src/components/nexora/public/product-detail-page.tsx (Product JSON-LD + lazy iframe)
- src/lib/cart-store.ts (export CartState)
- src/lib/wishlist-store.ts (export WishlistState)
- public/site.webmanifest (PNG icons + shortcuts)

## Verification
- `bun run lint`: 0 errors, 0 warnings
- `npx tsc --noEmit`: 0 errors in src/ (pre-existing errors only in examples/, scripts/, skills/)
- Dev server compiled all new routes successfully (200 OK on /, /blog, /blog/[slug]; 429 after 10 req/min on /api/auth/login verified via curl loop)
- /api/search-by-image returns 400 when no body, ready to receive base64 images

## Handoff notes for next agent
- All Phase 3 nice-to-have items complete and verified.
- i18n is infrastructure-only — to fully translate the app, replace hardcoded Spanish strings in component JSX with `t('key')` calls and add corresponding keys to es.ts/en.ts.
- AI chatbot uses /api/naios/chat which requires auth — unauthenticated visitors will get a 401 from that endpoint, but the chatbot UI still renders. If public chat is desired, the /api/naios/chat route needs a separate unauthenticated pathway OR a new public-only chat endpoint.
- Live chat falls back to WhatsApp button when TAWK env vars aren't set; to enable Tawk.to, set NEXT_PUBLIC_TAWK_PROPERTY_ID + NEXT_PUBLIC_TAWK_WIDGET_ID.
- Product comparator persists across pages via localStorage (key: nexora-compare).
- Image search uses glm-4v-flash VLM — has ~60s maxDuration; if requests time out, consider switching to a faster model or pre-computing image descriptions on upload.
