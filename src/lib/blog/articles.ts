// NEXORA — Blog articles (static, server-side metadata)
// Used by sitemap.ts and (optionally) a future /blog route.

export interface BlogArticle {
  slug: string
  title: string
  description: string
  publishedAt: string // ISO date
  updatedAt?: string // ISO date
  category: string
  tags: string[]
  author: string
  readingTimeMin: number
  cover?: string
}

// Static, curated list of blog articles. Order = newest first.
export const blogArticles: BlogArticle[] = [
  {
    slug: 'como-importar-desde-china-a-colombia-2025',
    title: 'Cómo importar desde China a Colombia en 2025: guía completa',
    description:
      'Todo lo que necesitas saber para importar productos desde China a Colombia: aranceles, logística, tiempos, pagos y errores comunes.',
    publishedAt: '2025-01-15',
    updatedAt: '2025-03-02',
    category: 'Guías',
    tags: ['importación', 'china', 'colombia', 'aduana'],
    author: 'Equipo NEXORA',
    readingTimeMin: 9,
  },
  {
    slug: 'mejores-proveedores-de-china-para-colombia',
    title: 'Los 10 mejores proveedores de China para importar a Colombia',
    description:
      'Ranking actualizado de proveedores chinos confiables por categoría: tecnología, moda, belleza, hogar y más.',
    publishedAt: '2025-02-04',
    category: 'Proveedores',
    tags: ['proveedores', 'alibaba', '1688', 'verificación'],
    author: 'Equipo NEXORA',
    readingTimeMin: 7,
  },
  {
    slug: 'cuanto-cuesta-importar-de-china-a-colombia',
    title: '¿Cuánto cuesta importar de China a Colombia? Desglose real',
    description:
      'Producto + envío + arancel + IVA + margen. Te mostramos el cálculo paso a paso con ejemplos reales.',
    publishedAt: '2025-02-20',
    category: 'Costos',
    tags: ['costos', 'arancel', 'iva', 'envío'],
    author: 'Equipo NEXORA',
    readingTimeMin: 6,
  },
  {
    slug: 'tiempos-de-envio-china-colombia-dhl-fedex',
    title: 'Tiempos de envío de China a Colombia: DHL vs FedEx',
    description:
      'Comparamos DHL, FedEx y otras alternativas para enviar paquetes desde China a Colombia. Costos, tiempos y seguimiento.',
    publishedAt: '2025-03-10',
    category: 'Logística',
    tags: ['dhl', 'fedex', 'envío', 'logística'],
    author: 'Equipo NEXORA',
    readingTimeMin: 5,
  },
  {
    slug: 'errores-comunes-al-importar-de-china',
    title: '7 errores comunes al importar de China (y cómo evitarlos)',
    description:
      'Aprende de la experiencia de cientos de importadores. Evita estos errores y ahorra tiempo, dinero y dolores de cabeza.',
    publishedAt: '2025-03-25',
    category: 'Guías',
    tags: ['errores', 'consejos', 'principiantes'],
    author: 'Equipo NEXORA',
    readingTimeMin: 8,
  },
  {
    slug: 'metodos-de-pago-para-importar-de-china',
    title: 'Métodos de pago para importar de China: cuál usar y cuál evitar',
    description:
      'Nequi, Daviplata, PayPal, transferencia bancaria, Alibaba Trade Assurance. Ventajas, desventajas y comisiones.',
    publishedAt: '2025-04-08',
    category: 'Pagos',
    tags: ['pagos', 'nequi', 'paypal', 'transferencia'],
    author: 'Equipo NEXORA',
    readingTimeMin: 6,
  },
  {
    slug: 'que-es-incoterms-fob-cif-ddp',
    title: 'Incoterms explicados: FOB, CIF, DDP y cuándo usar cada uno',
    description:
      'Una guía clara y sin tecnicismos para entender los Incoterms más usados al importar desde China.',
    publishedAt: '2025-04-22',
    category: 'Logística',
    tags: ['incoterms', 'fob', 'cif', 'ddp'],
    author: 'Equipo NEXORA',
    readingTimeMin: 7,
  },
  {
    slug: 'negociar-con-proveedores-chinos-consejos',
    title: 'Cómo negociar con proveedores chinos: 10 consejos que funcionan',
    description:
      'Estrategias prácticas para conseguir mejores precios, MOQ más bajos y condiciones favorables con fábricas chinas.',
    publishedAt: '2025-05-05',
    category: 'Proveedores',
    tags: ['negociación', 'precios', 'moq'],
    author: 'Equipo NEXORA',
    readingTimeMin: 8,
  },
  {
    slug: 'importar-replicas-premium-es-legal',
    title: 'Importar réplicas premium a Colombia: ¿es legal?',
    description:
      'Aclaramos el marco legal de las réplicas premium en Colombia y cómo NEXORA trabaja de forma transparente.',
    publishedAt: '2025-05-19',
    category: 'Legal',
    tags: ['legal', 'réplicas', 'colombia', 'propiedad intelectual'],
    author: 'Equipo NEXORA',
    readingTimeMin: 6,
  },
  {
    slug: 'diy-vs-usar-un-importador-nexora',
    title: 'Importar por tu cuenta vs. usar un importador como NEXORA',
    description:
      'Comparamos el DIY completo frente a delegar en una plataforma. Tiempos, costos ocultos y riesgos.',
    publishedAt: '2025-06-02',
    category: 'Guías',
    tags: ['comparativa', 'diy', 'plataforma'],
    author: 'Equipo NEXORA',
    readingTimeMin: 7,
  },
]

// Helper para obtener todos los slugs (usado por sitemap).
export function getAllBlogSlugs(): string[] {
  return blogArticles.map((a) => a.slug)
}

// Helper para obtener un artículo por slug.
export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return blogArticles.find((a) => a.slug === slug)
}
