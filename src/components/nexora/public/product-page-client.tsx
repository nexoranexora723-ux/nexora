'use client'

import { ProductDetailPage } from '@/components/nexora/public/product-detail-page'
import { useRouter } from 'next/navigation'

interface ProductData {
  id: string
  sku: string
  name: string
  description: string | null
  longDescription: string | null
  brand: { id: string; name: string } | null
  category: { id: string; name: string; icon: string | null } | null
  supplier: { id: string; companyName: string } | null
  imageUrl: string | null
  images: string[]
  videoUrl: string | null
  estimatedCost: number | null
  suggestedPrice: number | null
  currencyCode: string
  isFeatured: boolean
  specs: { label: string; value: string }[]
  features: string[]
  rating: number
  reviewCount: number
  soldCount: number
}

export function ProductPageClient({ product }: { product: ProductData }) {
  const router = useRouter()

  return (
    <ProductDetailPage
      productId={product.id}
      onBack={() => router.push('/?view=catalog')}
      onRequest={() => router.push('/?register=1')}
    />
  )
}
