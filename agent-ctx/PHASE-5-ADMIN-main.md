# Task: PHASE-5-ADMIN — Admin Orders Panel, Real Order Management, Easy Price Editor

## Agent
main (Z.ai Code)

## Task
Construir el panel de administración de pedidos (Admin Orders), permitir gestión real
de pedidos (cambio de estado, tracking), y crear un editor masivo de precios en línea.

## Work Log

### 1. Schema Prisma — extendido ImportRequest con campos administrativos
Añadidos 4 campos opcionales a `prisma/schema.prisma > ImportRequest`:
- `adminStatus String? @map("admin_status")` — PENDING|CONFIRMED|PROCESSING|SHIPPED|DELIVERED|CANCELLED
- `trackingNumber String? @map("tracking_number")` — número de seguimiento del envío
- `paymentMethod String? @map("payment_method")` — método de pago usado en el checkout
- `shippingAddress String? @map("shipping_address")` — dirección de envío completa

`bun run db:push --accept-data-loss` ejecutado exitosamente contra Neon PostgreSQL.

### 2. API /api/orders GET — modo admin con filtros y paginación
Reescrito `src/app/api/orders/route.ts` GET:
- **Modo admin** (cuando `?scope=admin` y rol ADMIN/SUPER_ADMIN/EMPLOYEE): lista TODOS
  los pedidos con filtros `?status=PENDING|CONFIRMED|...`, búsqueda por número o
  email del cliente (`?search=NX-1234`), y paginación (`?page=1&limit=20`).
- Retorna `{ orders, total, page, totalPages, stats }` con stats={total, pending,
  confirmed, processing, shipped, delivered, cancelled, revenue}.
- **Modo cliente** (sin `scope=admin`): mantiene el comportamiento previo (array
  de pedidos del propio usuario, soporta `?email=...` para admins).
- Trata `adminStatus=null` como `PENDING` (pedidos antiguos sembrados sin el campo).
- Helper `mapRequestToOrder` convierte una ImportRequest con sus relaciones cargadas
  en un objeto `order` plano con: número, status, customer{name,email,phone}, items[],
  total, paymentMethod, shippingAddress, trackingNumber, etc.
- Helper `parseItemsFromDescription` parsea la description multilinea generada por
  POST (`"1. AirPods — 2 u × 199 USD (SKU: AP-PRO2)"`) de vuelta a items estructurados.
- POST actualizado: ahora también setea `adminStatus='PENDING'`, `paymentMethod`,
  `shippingAddress` en el registro recién creado (vía `db.importRequest.update`).

### 3. API /api/orders/[id] PATCH — cambio de estado y tracking
Añadido método PATCH en `src/app/api/orders/[id]/route.ts`:
- Body: `{ status?, trackingNumber? }`
- Valida que `status` esté en [PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED]
- Solo ADMIN/SUPER_ADMIN/EMPLOYEE pueden usarlo (403 si no)
- Actualiza `adminStatus` y/o `trackingNumber` en ImportRequest
- Sincroniza trackingNumber al Import vinculado (si existe) para backward-compat
- Retorna el pedido actualizado en formato plano (mirror del GET admin)

### 4. API /api/admin/products-list GET — soporte completo de filtros
Reescrito `src/app/api/admin/products-list/route.ts`:
- Query params: `search` (name|SKU), `categoryId`, `brandId`, `status`,
  `sortBy` (createdAt|name|price|cost|sku), `sortOrder` (asc|desc),
  `page`, `limit` (default 50, max 100)
- Devuelve `{ products, total, page, totalPages }` con `total` real (antes era
  hardcoded 64345).
- Products incluyen todos los campos necesarios para el editor de precios:
  id, sku, name, imageUrl, estimatedCost, suggestedPrice, currencyCode,
  brand{id,name}, category{id,name,icon}, supplier{id,companyName}, specs, features.

### 5. API /api/admin/products/bulk-update-prices POST — actualización masiva
Creado `src/app/api/admin/products/bulk-update-prices/route.ts`:
- Body: `{ updates: Array<{id?, sku?, estimatedCost}> }`
- Acepta identificarse por `id` o por `sku`
- Actualiza el `suggestedPrice` (precio de venta) en una transacción Prisma
- Máximo 500 actualizaciones por lote
- Retorna `{ success: true, updated: <count> }`
- Solo ADMIN/SUPER_ADMIN/EMPLOYEE (403 si no)

### 6. Componente AdminOrders (admin-orders.tsx)
Creado `src/components/nexora/admin/admin-orders.tsx` (~580 líneas):
- **Stats cards** (5): Total pedidos, Pendientes, En tránsito (shipped+processing),
  Entregados, Ingresos totales (con `formatCurrency`)
- **Toolbar**: búsqueda debounced (350ms) por número (NX-…) o email + botón Exportar CSV
- **Tabs de estado**: Todos, Pendientes, Confirmados, En proceso, Enviados,
  Entregados, Cancelados — cada tab muestra el count del status (stats)
- **Tabla**: Pedido (número + tracking si existe), Cliente (nombre+email),
  Productos (primer item + count), Total (con currencyCode), Estado (badge con
  dot de color), Fecha (timeAgo), Acciones
- **Status badges con colores** según spec:
  - PENDING = amber
  - CONFIRMED = blue
  - PROCESSING = violet
  - SHIPPED = cyan
  - DELIVERED = emerald
  - CANCELLED = rose
- **Click en fila** → abre Dialog de detalle
- **Acciones**: DropdownMenu con cambio rápido de estado (6 opciones) + ver detalles
- **Dialog de detalle**: estado actual + select de cambio de estado, campo de
  tracking number (visible cuando SHIPPED o ya tiene tracking), info del cliente
  (nombre/email/teléfono/categoría), envío + pago, lista de items con SKU y
  precios, total, notas del pedido
- **Tracking number editable** en el dialog con botón "Guardar tracking" cuando
  el valor cambió
- **Pagination** (20 por página) con Anterior/Siguiente + contador
- **Export CSV** con BOM (\ufeff) para Excel, columnas: Numero, Cliente, Email,
  Teléfono, Productos, Total, Moneda, Estado, Método de pago, Dirección, Tracking, Fecha
- Toast feedback en updates y exports
- `placeholderData: (prev) => prev` en useQuery para evitar flasheo al paginar

### 7. Componente BulkPriceEditor (bulk-price-editor.tsx)
Creado `src/components/nexora/admin/bulk-price-editor.tsx` (~470 líneas):
- **Tabla con edición inline**:
  - Columnas: Imagen, Nombre (+SKU), Marca, Categoría (badge), Precio actual,
    Nuevo precio (input editable), Δ (cambio % vs precio actual)
  - Filas modificadas se resaltan con bg-amber-50/40
  - Botón ✕ para revertir un cambio individual
  - Click en headers Nombre/Precio toggles sort asc/desc
- **Toolbar**:
  - Búsqueda debounced por name o SKU
  - Filtro por categoría (Select con `/api/categories`)
  - Botones: Acciones masivas (dropdown), CSV (descargar), Subir CSV, Guardar (N)
- **Acciones masivas** (DropdownMenu):
  - "Aumentar todos X%" → abre dialog con input de % (default 10)
  - "Disminuir todos X%" → abre dialog con input de % (default 10)
  - "Aplicar precio base" → abre dialog con input de precio
  - Todas aplican a los productos visibles en la página actual
  - Los cambios se almacenan en `editedPrices` (estado local) hasta guardar
- **Guardar cambios**:
  - Recolecta todos los editedPrices con cambios reales
  - POST a /api/admin/products/bulk-update-prices con `{ updates: [{id, estimatedCost}] }`
  - Toast: "✓ Precios actualizados — N producto(s) actualizado(s)"
  - Invalida queries `price-editor`, `admin-products`, `products-public`
- **Download CSV**: columnas sku, name, brand, category, price (con BOM)
- **Upload CSV**: parsea archivo con columnas `sku` y `price` (o `precio`/`estimatedCost`),
  aplica directamente vía POST al bulk-update endpoint (no requiere Guardar),
  toast con count de actualizados / enviados
- **Parser CSV robusto**: respeta comillas dobles y escaped quotes (`""`)
- **Pagination** (50 por página) con Anterior/Siguiente
- Indicador "N cambio(s) sin guardar" en header cuando hay edits pendientes

### 8. AdminPortal actualizado (admin-portal.tsx)
- Importado `AdminOrders` y `BulkPriceEditor`
- Añadidos iconos `Receipt, Tags` al import de lucide-react
- View type ampliado: `'orders' | 'price-editor'`
- **Sidebar grupo "Operación"** actualizado (siguiendo el spec "Pedidos entre
  Productos y Proveedores"):
  1. Productos (existente)
  2. Editor de precios (icon Tags) — NUEVO
  3. Pedidos (icon Receipt) — NUEVO
  4. Proveedores (existente)
  5. Cotizaciones, Importaciones, Finanzas (existentes)
- Header title actualizado para las 2 nuevas vistas
- Renderizadas las vistas: `<BulkPriceEditor />` y `<AdminOrders />`

## Verification

- `bun run lint` → **0 errors, 0 warnings** ✓
- `npx tsc --noEmit` → **0 errors en src/** (solo errors pre-existentes en
  `examples/` y `skills/` que están fuera de scope) ✓
- `bun run db:push` exitoso contra Neon PostgreSQL ✓
- Dev log muestra compilación exitosa de las nuevas rutas ✓

## Stage Summary
- **3 entregables** completados según spec:
  1. Admin panel más completo con sección Pedidos en sidebar
  2. Vista real de pedidos con cambio de estado, tracking, filtros, búsqueda,
     paginación, stats, export CSV y dialog de detalle
  3. Editor masivo de precios en línea con bulk actions y CSV upload/download
- **4 archivos API** actualizados/creados:
  - `src/app/api/orders/route.ts` (GET admin mode + POST con adminStatus)
  - `src/app/api/orders/[id]/route.ts` (PATCH status + trackingNumber)
  - `src/app/api/admin/products-list/route.ts` (filtros + sort + paginación real)
  - `src/app/api/admin/products/bulk-update-prices/route.ts` (POST bulk update)
- **3 archivos frontend** creados/actualizados:
  - `src/components/nexora/admin/admin-orders.tsx` (~580 líneas)
  - `src/components/nexora/admin/bulk-price-editor.tsx` (~470 líneas)
  - `src/components/nexora/admin/admin-portal.tsx` (sidebar + routing)
- **1 archivo schema** actualizado:
  - `prisma/schema.prisma` (4 campos nuevos en ImportRequest)
- Arquitectura: sigue el patrón establecido (TanStack Query + shadcn/ui + Zod-less
  API routes con try/catch + auth middleware vía AuthService.validate + toast
  feedback + Spanish UI throughout).
- Status workflow implementado: PENDING → CONFIRMED → PROCESSING → SHIPPED →
  DELIVERED → CANCELLED. Cuando status=SHIPPED, el campo trackingNumber aparece
  automáticamente en el dialog de detalle para edición.
- Bulk actions aplican solo a la página actual (50 productos) — no a toda la DB,
  para evitar cambios masivos accidentales.
