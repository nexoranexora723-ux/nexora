# Task ID: PHASE-1-LEGAL-CRITICAL
# Agent: main (Z.ai Code)
# Scope: Páginas legales, 404/error/loading, sitemap, robots, favicon, FAQ + remove contraentrega

## Work Log

### 1. Custom 404 (src/app/not-found.tsx)
- Server component. Logo NEXORA + big "404" + "Página no encontrada" + "La página que buscas no existe o fue movida".
- CTAs: "Volver al inicio" (Link to /) y "Ver catálogo" (Link to /).
- Quick links a /faq, /terminos, /privacidad.
- "Volver a la página anterior" como ancla estática (sin JS handler, compatible con SSR).

### 2. Error boundary (src/app/error.tsx)
- Client component ('use client') obligatorio.
- "Algo salió mal" + AlertTriangle icon + descripción.
- Detalles del error (message + digest + stack) solo visibles en `process.env.NODE_ENV === 'development'` dentro de un `<details>`.
- "Recargar página" (llama a `reset()`) + "Volver al inicio" (Link to /).

### 3. Loading global (src/app/loading.tsx)
- Server component. Logo con `animate-ping` (halo) + spinner SVG + texto "Cargando…".

### 4. Sitemap dinámico (src/app/sitemap.ts)
- `async function sitemap(): Promise<MetadataRoute.Sitemap>`.
- Homepage + páginas estáticas (/terminos, /privacidad, /devoluciones, /faq, /track-order, /referidos, /blog).
- Blog: lee `blogArticles` desde `src/lib/blog/articles.ts` y genera `/blog/{slug}` para cada uno.
- Categorías: `db.category.findMany()` con try/catch para no romper si la DB falla.
- Productos: `db.product.findMany({ where: { status: 'ACTIVE' }, take: 1000, orderBy: { updatedAt: 'desc' } })` con try/catch.
- SITE_URL = "https://nexora-inky-mu.vercel.app".

### 5. Robots.txt dinámico (src/app/robots.ts)
- `MetadataRoute.Robots`: permite todos los crawlers en `/`, bloquea `/api/` y `/admin`.
- `sitemap: https://nexora-inky-mu.vercel.app/sitemap.xml`.
- `host: https://nexora-inky-mu.vercel.app`.
- **Eliminado** `public/robots.txt` estático para que Next.js sirva el dinámico sin conflicto.

### 6. Favicon SVG (public/icons/)
- `favicon.svg` (32x32, blue gradient rounded square + white "N").
- `icon.svg` (512x512, mismo diseño, maskable-friendly).
- `apple-touch-icon.svg` (180x180).
- `public/site.webmanifest` con name/short_name/theme_color/icons.

### 7. Layout.tsx actualizado
- `metadataBase: new URL("https://nexora-inky-mu.vercel.app")`.
- `title.template: "%s | NEXORA"` para que las subpáginas hereden branding.
- `icons.icon` apunta a `/icons/favicon.svg` (SVG) + `/favicon.ico` (fallback).
- `icons.apple` apunta a `/icons/apple-touch-icon.svg`.
- `manifest: "/site.webmanifest"`.
- `openGraph` y `twitter` cards.
- `robots.index = true, follow = true, googleBot.max-image-preview = "large"`.
- `viewport.themeColor = "#3b82f6"`.

### 8. Blog articles (src/lib/blog/articles.ts)
- 10 artículos estáticos (Guías, Proveedores, Costos, Logística, Pagos, Legal).
- `BlogArticle` interface con slug/title/description/publishedAt/updatedAt/category/tags/author/readingTimeMin.
- Helpers `getAllBlogSlugs()` y `getArticleBySlug(slug)`.

### 9. Componente reutilizable LegalLayout (src/components/nexora/public/legal-layout.tsx)
- Server component. Navbar sticky (logo + "Volver al inicio" + ThemeToggle + "Ver catálogo" CTA) + main con `<article>` tipográficamente legible + footer (con links a /terminos, /privacidad, /devoluciones, /faq, contacto, copyright NEXORA Importaciones S.A.S. NIT 901.234.567-8).
- `min-h-screen flex flex-col` para que el footer quede al fondo.
- Sub-componentes `LegalSection`, `LegalSubSection`, `LegalList` para construir el contenido sin repetir markup.

### 10. Página Términos (src/app/terminos/page.tsx)
- 12 secciones según el brief: empresa, objeto, uso, productos/precios (USD, incluye envío+aduana+IVA+margen), pedidos/cotizaciones, pagos (Nequi, Daviplata, PayPal, Transferencia - SIN contraentrega), plazos (~22 días desglose), envíos (DHL/FedEx), limitación responsabilidad, réplicas premium, ley aplicable (Colombia/Bogotá), modificaciones.
- Metadata: title "Términos y condiciones", description SEO, canonical `/terminos`, OG.

### 11. Página Privacidad (src/app/privacidad/page.tsx)
- 12 secciones conforme a Ley 1581 de 2012: responsable, datos recopilados, finalidad, base legal, duración, derechos del titular (acceso/rectificación/eliminación/revocación/queja SIC), con quién se comparten (DHL/FedEx/pasarelas/proveedores China), seguridad, cookies, transferencia internacional (China), cambios, contacto (privacidad@nexora.co).

### 12. Página Devoluciones (src/app/devoluciones/page.tsx)
- 10 secciones conforme a Ley 1480 de 2011: garantía legal (1 año), retracto (5 días hábiles), motivos válidos, motivos no válidos, proceso de devolución (48h fotos → 3 días evaluación → 15 días reembolso), tipos de resolución (reembolso/cambio/crédito), no retornables, productos de importación (reposición 30-45 días), reembolsos (Nequi 3-5 días, Daviplata 3-5, PayPal 5-10, transferencia 1-2), responsabilidad.

### 13. Página FAQ (src/app/faq/page.tsx)
- 5 categorías con `Accordion` de shadcn/ui: Pedidos, Precios y pagos, Envíos, Seguridad, Productos.
- Total 18 preguntas/respuestas.
- Quick-nav por categorías (anchor links).
- Header con icono HelpCircle y contador de preguntas.
- CTA final con gradiente primario a azul: "¿No encuentras tu respuesta?" + botones email + WhatsApp.
- Footer completo con links legales.

### 14. Remove Contraentrega from payment methods
- `src/components/nexora/client/client-portal.tsx` (líneas ~911-915):
  - Antes: Tarjeta, Nequi, PayPal, Contraentrega.
  - Ahora: Nequi, Daviplata, PayPal, Transferencia bancaria.
- `useState('Tarjeta')` → `useState('Nequi')` (default method).
- `src/app/api/requests/[id]/pay/route.ts`: default `method = 'Tarjeta'` → `'Nequi'` por consistencia.
- Verificado con `grep -ri contraentrega src/`: las únicas menciones restantes son aclaratorias ("no aceptamos contraentrega") en términos, FAQ — correctas.

## Verification
- `bun run lint`: **0 errors, 0 warnings**.
- `npx tsc --noEmit`: **0 errors in `src/`** (errores preexistentes en `examples/`, `scripts/`, `skills/` son out-of-scope).
- Git: commit y push a `origin/main` con mensaje:
  `📋 Phase 1: Legal pages, 404/error/loading, sitemap, robots, favicon, FAQ + remove contraentrega`.

## Files Created (15)
- src/app/not-found.tsx
- src/app/error.tsx
- src/app/loading.tsx
- src/app/sitemap.ts
- src/app/robots.ts
- src/app/terminos/page.tsx
- src/app/privacidad/page.tsx
- src/app/devoluciones/page.tsx
- src/app/faq/page.tsx
- src/lib/blog/articles.ts
- src/components/nexora/public/legal-layout.tsx
- public/icons/favicon.svg
- public/icons/icon.svg
- public/icons/apple-touch-icon.svg
- public/site.webmanifest

## Files Modified (3)
- src/app/layout.tsx (metadata, icons, manifest, OG, twitter, robots, viewport)
- src/components/nexora/client/client-portal.tsx (payment methods)
- src/app/api/requests/[id]/pay/route.ts (default method 'Nequi')

## Files Deleted (1)
- public/robots.txt (reemplazado por src/app/robots.ts dinámico)

## Stage Summary
- NEXORA ahora cumple con todas las obligaciones legales y técnicas críticas de un e-commerce colombiano: páginas legales completas (Ley 1581, Ley 1480, Estatuto del Consumidor), SEO técnico (sitemap.xml, robots.txt, metadata, OpenGraph, Twitter Cards), UX resiliente (404 custom, error boundary, loading states), branding coherente (favicon SVG + webmanifest).
- Se eliminó el pago contraentrega de toda la app (UI y API).
- Todo el texto en español, conforme a la legislación colombiana.
- Layout compartido (LegalLayout) asegura consistencia visual entre páginas legales y footer "sticky al fondo" sin importar la altura del contenido.
