import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { blogArticles, getArticleBySlug } from '@/lib/blog/articles'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LegalLayout } from '@/components/nexora/public/legal-layout'
import { ArrowLeft, Calendar, Clock, ArrowRight, Tag } from 'lucide-react'

interface PageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return blogArticles.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) return { title: 'Artículo no encontrado' }
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.description,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt ?? article.publishedAt,
      authors: [article.author],
      tags: article.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.description,
    },
  }
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) notFound()

  const related = blogArticles
    .filter((a) => a.slug !== article.slug && a.category === article.category)
    .slice(0, 3)

  // Schema.org JSON-LD: Article (BlogPosting) schema
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'headline': article.title,
    'description': article.description,
    'datePublished': article.publishedAt,
    'dateModified': article.updatedAt ?? article.publishedAt,
    'author': {
      '@type': 'Organization',
      'name': article.author,
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'NEXORA',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://nexora-inky-mu.vercel.app/icons/icon-512.png',
      },
    },
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': `https://nexora-inky-mu.vercel.app/blog/${article.slug}`,
    },
    'keywords': article.tags.join(', '),
    'articleSection': article.category,
    'inLanguage': 'es-CO',
  }

  // BreadcrumbList schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Inicio', 'item': 'https://nexora-inky-mu.vercel.app/' },
      { '@type': 'ListItem', 'position': 2, 'name': 'Blog', 'item': 'https://nexora-inky-mu.vercel.app/blog' },
      { '@type': 'ListItem', 'position': 3, 'name': article.title, 'item': `https://nexora-inky-mu.vercel.app/blog/${article.slug}` },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <LegalLayout title={article.title} lastUpdated={article.updatedAt ?? article.publishedAt}>
        <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="gap-1">{article.category}</Badge>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(article.publishedAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {article.readingTimeMin} min de lectura
          </span>
          <span className="flex items-center gap-1">
            <Tag className="h-3 w-3" /> {article.tags.join(', ')}
          </span>
        </div>

        <div className="space-y-4 text-[15px] leading-relaxed text-foreground/90">
          <p className="text-lg text-foreground">{article.description}</p>
          <p>
            Este artículo forma parte de la serie de guías de NEXORA sobre
            importación desde China a Colombia. En NEXORA te acompañamos en
            todo el proceso: desde la búsqueda del proveedor adecuado hasta la
            entrega final en tu puerta.
          </p>
          <p>
            Nuestro equipo de expertos verifica cada proveedor, negocia los
            mejores precios y coordina toda la logística — incluida la
            aduana — para que tú solo tengas que elegir el producto.
          </p>
          <h2 className="mt-8 text-xl font-semibold tracking-tight">Puntos clave</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>Investigación de proveedores y muestras antes de committear.</li>
            <li>Entiende los costos totales: producto + envío + arancel + IVA.</li>
            <li>Usa métodos de pago con protección al comprador.</li>
            <li>Planifica los tiempos: producción + envío + aduana + última milla.</li>
            <li>Trabaja con un importador confiable para reducir riesgos.</li>
          </ul>

          <div className="mt-8 rounded-xl border bg-muted/40 p-5">
            <p className="text-sm font-medium">¿Quieres importar este tipo de producto?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              NEXORA lo hace por ti. Solicita tu cotización gratuita en menos de 24 horas.
            </p>
            <Button asChild className="mt-3 gap-1.5">
              <Link href="/">Solicitar cotización <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-12 border-t pt-8">
            <h2 className="mb-4 text-xl font-semibold tracking-tight">Artículos relacionados</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="group rounded-lg border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
                >
                  <Badge variant="outline" className="mb-2 text-[10px]">{r.category}</Badge>
                  <p className="text-sm font-medium leading-snug group-hover:text-primary">{r.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.description}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between border-t pt-6 text-sm">
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link href="/blog"><ArrowLeft className="h-4 w-4" /> Volver al blog</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link href="/">Ir al catálogo <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </LegalLayout>
    </>
  )
}
