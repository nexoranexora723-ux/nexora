'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Search, Package, ArrowRight } from 'lucide-react'
import type { Product } from '@/lib/types'

interface CatalogViewProps {
  onNavigate: (view: string) => void
  onLogin: () => void
  onRegister: () => void
}

export function CatalogView({ onNavigate, onRegister }: CatalogViewProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['products-public'],
    queryFn: async () => (await fetch('/api/products')).json(),
  })

  const categories = products ? [...new Set(products.map((p) => p.category?.name).filter(Boolean))] : []
  const filtered = (products ?? []).filter((p) => {
    const matchesQuery = !query || p.name.toLowerCase().includes(query.toLowerCase()) || p.description?.toLowerCase().includes(query.toLowerCase())
    const matchesCat = category === 'all' || p.category?.name === category
    return matchesQuery && matchesCat
  })

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate('landing')} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Volver
            </button>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground">
              <span className="text-sm font-black">N</span>
            </div>
            <span className="font-bold">NEXORA</span>
          </div>
          <Button size="sm" onClick={onRegister}>Registrarse</Button>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Catálogo de productos</h1>
          <p className="mt-2 text-muted-foreground">Productos importables desde China. Solicita cualquier producto y nosotros lo importamos por ti.</p>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar productos..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button variant={category === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setCategory('all')}>Todos</Button>
            {categories.map((c) => (
              <Button key={c} variant={category === c ? 'default' : 'outline'} size="sm" onClick={() => setCategory(c)}>{c}</Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">No se encontraron productos</p>
            <Button className="mt-4" onClick={onRegister}>Solicitar producto personalizado</Button>
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((p) => (
              <Card key={p.id} className="group overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="relative aspect-square overflow-hidden bg-muted">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl">📦</div>
                  )}
                  {p.category?.icon && (
                    <Badge className="absolute left-2 top-2 bg-background/90 text-foreground shadow-sm backdrop-blur">{p.category.icon} {p.category.name}</Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <p className="line-clamp-2 text-sm font-medium">{p.name}</p>
                  {p.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>}
                  <div className="mt-3 flex items-center justify-between">
                    {p.estimatedCost ? (
                      <p className="text-sm">Desde <span className="text-lg font-bold">${p.estimatedCost}</span></p>
                    ) : <span className="text-xs text-muted-foreground">Precio bajo consulta</span>}
                  </div>
                  <Button size="sm" className="mt-3 w-full gap-1.5" onClick={onRegister}>
                    Solicitar importación <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
