'use client'

/**
 * NEXORA — Instagram Feed
 * Muestra un feed de productos destacados como si fueran posts de Instagram.
 * Links al perfil real de Instagram.
 */
import { useQuery } from '@tanstack/react-query'
import { Heart, MessageCircle, ExternalLink, Instagram } from 'lucide-react'
import { motion } from 'framer-motion'
import { INSTAGRAM_URL, INSTAGRAM_HANDLE, generateInstagramFeedFromProducts } from '@/lib/marketing'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export function InstagramFeed({ limit = 6 }: { limit?: number }) {
  const { data: feed, isLoading } = useQuery({
    queryKey: ['instagram-feed'],
    queryFn: async () => {
      const resp = await fetch('/api/products?featured=true&limit=12')
      if (!resp.ok) throw new Error('Failed')
      const data = await resp.json()
      return generateInstagramFeedFromProducts(data.products).slice(0, limit)
    },
    staleTime: 5 * 60 * 1000,
  })

  return (
    <section className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Instagram className="h-6 w-6" />
              Síguenos en Instagram
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              @{INSTAGRAM_HANDLE} — Inspiración y novedades diarias
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="gap-2">
              Ver más <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
          {isLoading
            ? Array.from({ length: limit }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))
            : feed?.map((post, idx) => (
                <motion.a
                  key={post.id}
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group relative aspect-square overflow-hidden rounded-lg bg-muted"
                >
                  <img
                    src={post.imageUrl}
                    alt={post.caption.substring(0, 50)}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="absolute bottom-2 left-2 right-2 text-white text-xs">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3 fill-white" />
                          {post.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {post.comments}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.a>
              ))}
        </div>
      </div>
    </section>
  )
}
