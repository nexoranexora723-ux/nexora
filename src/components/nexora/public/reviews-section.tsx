'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star, ThumbsUp, BadgeCheck, Loader2, MessageSquarePlus, X, Camera, ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-store'
import { useToast } from '@/hooks/use-toast'
import { timeAgo } from '@/lib/format'

export interface Review {
  id: string
  userName: string
  userRole: string | null
  rating: number
  title: string
  comment: string
  images: string[]
  verified: boolean
  createdAt: string
}

export interface ReviewStats {
  average: number
  total: number
  distribution: Record<number, number>
}

interface ReviewsSectionProps {
  productId: string
  /** Optional order ID — when provided, the review is marked as "verified purchase". */
  orderId?: string
}

/**
 * ReviewsSection — Muestra el promedio de calificaciones, la distribución por
 * estrellas y la lista de reseñas con un formulario para crear nuevas.
 */
export function ReviewsSection({ productId, orderId }: ReviewsSectionProps) {
  const qc = useQueryClient()
  const { user } = useAuth()
  const { toast } = useToast()
  const [sort, setSort] = React.useState<'recent' | 'highest' | 'lowest'>('recent')
  const [showForm, setShowForm] = React.useState(false)
  const [rating, setRating] = React.useState(5)
  const [hoverRating, setHoverRating] = React.useState(0)
  const [title, setTitle] = React.useState('')
  const [comment, setComment] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [reviewImages, setReviewImages] = React.useState<string[]>([])

  const { data, isLoading } = useQuery<{ reviews: Review[]; stats: ReviewStats }>({
    queryKey: ['reviews', productId, sort],
    queryFn: async () => {
      const res = await fetch(`/api/reviews?productId=${productId}&sort=${sort}`)
      if (!res.ok) throw new Error('Error al cargar reseñas')
      return res.json()
    },
    staleTime: 30 * 1000,
  })

  const reviews = data?.reviews ?? []
  const stats = data?.stats ?? { average: 0, total: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } }

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          rating,
          title,
          comment,
          userName: user ? `${user.firstName} ${user.lastName}` : 'Cliente NEXORA',
          userId: user?.id ?? null,
          orderId: orderId ?? null,
          images: reviewImages.length > 0 ? reviewImages : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al enviar')
      return data
    },
    onMutate: () => setSubmitting(true),
    onSuccess: () => {
      toast({ title: '¡Reseña publicada!', description: 'Gracias por tu opinión.' })
      setTitle('')
      setComment('')
      setRating(5)
      setReviewImages([])
      setShowForm(false)
      qc.invalidateQueries({ queryKey: ['reviews', productId] })
    },
    onError: (err: Error) => {
      toast({ title: 'No se pudo publicar', description: err.message, variant: 'destructive' })
    },
    onSettled: () => setSubmitting(false),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim().length < 3 || comment.trim().length < 10) {
      toast({ title: 'Revisa los campos', description: 'Título (3+ caracteres) y comentario (10+ caracteres).', variant: 'destructive' })
      return
    }
    mutation.mutate()
  }

  const distribution = [5, 4, 3, 2, 1] as const
  const total = stats.total || 1

  return (
    <section className="mt-8 border-t pt-8" aria-labelledby="reviews-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 id="reviews-heading" className="text-2xl font-bold tracking-tight">
            Opiniones de clientes
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Reseñas verificadas de compradores reales
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} variant={showForm ? 'outline' : 'default'} className="gap-1.5">
          {showForm ? <X className="h-4 w-4" /> : <MessageSquarePlus className="h-4 w-4" />}
          {showForm ? 'Cancelar' : 'Escribir una reseña'}
        </Button>
      </div>

      {/* Summary: average + distribution */}
      <div className="mt-4 grid grid-cols-1 gap-6 rounded-xl border bg-muted/30 p-5 md:grid-cols-[200px_1fr]">
        <div className="flex flex-col items-center justify-center text-center">
          {isLoading ? (
            <Skeleton className="h-16 w-24" />
          ) : (
            <>
              <div className="text-5xl font-bold tabular-nums">{stats.average.toFixed(1)}</div>
              <div className="mt-1 flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-4 w-4',
                      i <= Math.round(stats.average) ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted',
                    )}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {stats.total} opinión{stats.total !== 1 ? 'es' : ''}
              </p>
            </>
          )}
        </div>
        <div className="space-y-1.5">
          {distribution.map((star) => {
            const count = stats.distribution[star] ?? 0
            const pct = (count / total) * 100
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="flex w-12 items-center gap-1 font-medium">
                  {star} <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right tabular-nums text-muted-foreground">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Review form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-xl border bg-background p-5">
          <div>
            <Label className="mb-2 block text-sm font-medium">Tu calificación</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i)}
                  onMouseEnter={() => setHoverRating(i)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`${i} estrellas`}
                  className="rounded p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      'h-7 w-7 transition-colors',
                      i <= (hoverRating || rating) ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted',
                    )}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm font-medium tabular-nums">{rating}/5</span>
            </div>
          </div>
          <div>
            <Label htmlFor="review-title" className="mb-1.5 block text-sm font-medium">Título</Label>
            <Input
              id="review-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Resumen de tu experiencia (ej: 'Excelente calidad')"
              maxLength={120}
              required
            />
          </div>
          <div>
            <Label htmlFor="review-comment" className="mb-1.5 block text-sm font-medium">Comentario</Label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Cuéntanos qué te pareció el producto, la calidad, el envío..."
              rows={4}
              maxLength={2000}
              required
            />
          </div>
          {/* Upload de fotos */}
          <div>
            <Label className="mb-1.5 block text-sm font-medium">Fotos del producto (opcional)</Label>
            <div className="flex flex-wrap items-center gap-2">
              {reviewImages.map((img, i) => (
                <div key={i} className="relative h-20 w-20 overflow-hidden rounded-lg border">
                  <img src={img} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setReviewImages(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white shadow"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {reviewImages.length < 5 && (
                <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                  <div className="flex flex-col items-center gap-1">
                    <Camera className="h-5 w-5" />
                    <span className="text-[10px]">Agregar</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      if (file.size > 5 * 1024 * 1024) {
                        toast({ title: 'Imagen muy grande', description: 'Máximo 5MB', variant: 'destructive' })
                        return
                      }
                      const reader = new FileReader()
                      reader.onload = () => {
                        setReviewImages(prev => [...prev, reader.result as string])
                      }
                      reader.readAsDataURL(file)
                    }}
                  />
                </label>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Sube hasta 5 fotos. Máximo 5MB cada una.</p>
          </div>
          {orderId && (
            <p className="text-xs text-emerald-600">
              ✓ Tu reseña será marcada como <strong>Compra verificada</strong>
            </p>
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting} className="gap-1.5">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
              Publicar reseña
            </Button>
          </div>
        </form>
      )}

      {/* Sort + list */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {reviews.length} opinión{reviews.length !== 1 ? 'es' : ''}
        </p>
        <Select value={sort} onValueChange={(v) => setSort(v as 'recent' | 'highest' | 'lowest')}>
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Más recientes</SelectItem>
            <SelectItem value="highest">Mayor calificación</SelectItem>
            <SelectItem value="lowest">Menor calificación</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
        ) : reviews.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <Star className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm font-medium">Aún no hay reseñas</p>
            <p className="text-xs text-muted-foreground">Sé el primero en compartir tu experiencia</p>
          </div>
        ) : (
          reviews.map((review) => (
            <article key={review.id} className="rounded-xl border bg-background p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {review.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold">{review.userName}</p>
                      {review.verified && (
                        <Badge variant="secondary" className="gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          <BadgeCheck className="h-3 w-3" /> Compra verificada
                        </Badge>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className={cn(
                              'h-3 w-3',
                              i <= review.rating ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted',
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{timeAgo(review.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <h4 className="mt-3 text-sm font-semibold">{review.title}</h4>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
              {Array.isArray(review.images) && review.images.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {review.images.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`Foto ${i + 1} de la reseña`}
                      className="h-16 w-16 rounded-lg border object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ))}
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  )
}
