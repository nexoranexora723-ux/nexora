import type { Metadata } from 'next'
import Link from 'next/link'
import { blogArticles } from '@/lib/blog/articles'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LegalLayout } from '@/components/nexora/public/legal-layout'
import { ArrowLeft, Calendar, Clock, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Blog — Guías de importación desde China',
  description:
    'Guías, consejos y análisis sobre importación desde China a Colombia: aranceles, logística, proveedores, pagos, Incoterms y más.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog | NEXORA — Guías de importación desde China',
    description:
      'Guías, consejos y análisis sobre importación desde China a Colombia: aranceles, logística, proveedores, pagos, Incoterms y más.',
  },
}

export default function BlogPage() {
  // Schema.org JSON-LD: Blog schema
  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    'name': 'Blog NEXORA',
    'description': 'Guías, consejos y análisis sobre importación desde China a Colombia.',
    'url': 'https://nexora-inky-mu.vercel.app/blog',
    'publisher': {
      '@type': 'Organization',
      'name': 'NEXORA',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://nexora-inky-mu.vercel.app/icons/icon-512.png',
      },
    },
    'blogPost': blogArticles.map((a) => ({
      '@type': 'BlogPosting',
      'headline': a.title,
      'description': a.description,
      'datePublished': a.publishedAt,
      'dateModified': a.updatedAt ?? a.publishedAt,
      'url': `https://nexora-inky-mu.vercel.app/blog/${a.slug}`,
      'author': { '@type': 'Organization', 'name': a.author },
      'keywords': a.tags.join(', '),
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />
      <LegalLayout
        title="Blog NEXORA"
        subtitle="Guías, consejos y análisis sobre importación desde China a Colombia."
        lastUpdated="2025-06-02"
      >
        <div className="space-y-4">
          {blogArticles.map((a) => (
            <article
              key={a.slug}
              className="group rounded-xl border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="gap-1">{a.category}</Badge>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(a.publishedAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {a.readingTimeMin} min de lectura
                </span>
              </div>
              <h2 className="mt-2 text-lg font-semibold tracking-tight group-hover:text-primary">
                <Link href={`/blog/${a.slug}`}>{a.title}</Link>
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="mt-3 gap-1 px-0 text-primary hover:bg-transparent hover:underline"
              >
                <Link href={`/blog/${a.slug}`}>
                  Leer artículo <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-xl bg-muted/40 p-6 text-center">
          <p className="text-sm text-muted-foreground">¿Listo para importar?</p>
          <Button asChild className="mt-3 gap-1.5">
            <Link href="/">Ver catálogo <ArrowLeft className="h-4 w-4" /></Link>
          </Button>
        </div>
      </LegalLayout>
    </>
  )
}
