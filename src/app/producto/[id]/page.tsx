import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ProductPageClient } from '@/components/nexora/public/product-page-client'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const product = await db.product.findUnique({
    where: { id, status: 'ACTIVE' },
    select: { name: true, description: true, imageUrl: true, brand: { select: { name: true } }, category: { select: { name: true } }, estimatedCost: true },
  })

  if (!product) return { title: 'Producto no encontrado | NEXORA' }

  return {
    title: `${product.name} | NEXORA`,
    description: product.description || `${product.name} - Importado desde China. ${product.brand?.name || ''} ${product.category?.name || ''}. Precio: $${product.estimatedCost || 'bajo consulta'}`,
    openGraph: {
      title: product.name,
      description: product.description || '',
      images: product.imageUrl ? [{ url: product.imageUrl }] : [],
      type: 'website',
    },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await db.product.findUnique({
    where: { id, status: 'ACTIVE' },
    include: {
      brand: { select: { id: true, name: true } },
      category: { select: { id: true, name: true, icon: true } },
      supplier: { select: { id: true, companyName: true } },
    },
  })

  if (!product) notFound()

  const parseJSON = (str: string | null, fallback: unknown) => {
    try { return str ? JSON.parse(str) : fallback } catch { return fallback }
  }

  const productData = {
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    longDescription: product.longDescription,
    brand: product.brand,
    category: product.category,
    supplier: product.supplier,
    imageUrl: product.imageUrl,
    images: parseJSON(product.images, product.imageUrl ? [product.imageUrl] : []),
    videoUrl: product.videoUrl,
    estimatedCost: product.estimatedCost,
    suggestedPrice: product.suggestedPrice,
    currencyCode: product.currencyCode,
    isFeatured: product.isFeatured,
    specs: parseJSON(product.specs, []),
    features: parseJSON(product.features, []),
    rating: product.rating ?? 4.0,
    reviewCount: product.reviewCount,
    soldCount: product.soldCount,
  }

  // Breadcrumbs JSON-LD
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://nexora-inky-mu.vercel.app' },
      { '@type': 'ListItem', position: 2, name: 'Catálogo', item: 'https://nexora-inky-mu.vercel.app/?view=catalog' },
      { '@type': 'ListItem', position: 3, name: product.category?.name || 'Producto', item: `https://nexora-inky-mu.vercel.app/?view=catalog` },
      { '@type': 'ListItem', position: 4, name: product.name },
    ],
  }

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || '',
    image: product.imageUrl ? [product.imageUrl] : [],
    brand: { '@type': 'Brand', name: product.brand?.name || 'NEXORA' },
    offers: product.estimatedCost ? {
      '@type': 'Offer',
      price: product.estimatedCost,
      priceCurrency: product.currencyCode || 'USD',
      availability: 'https://schema.org/InStock',
    } : undefined,
  }

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Breadcrumbs */}
      <div className="border-b">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 text-sm">
          <Link href="/" className="text-muted-foreground hover:text-foreground">Inicio</Link>
          <span className="text-muted-foreground">/</span>
          <Link href="/?view=catalog" className="text-muted-foreground hover:text-foreground">Catálogo</Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">{product.category?.name}</span>
          <span className="text-muted-foreground">/</span>
          <span className="truncate font-medium text-foreground">{product.name}</span>
        </div>
      </div>

      <ProductPageClient product={productData} />
    </div>
  )
}
