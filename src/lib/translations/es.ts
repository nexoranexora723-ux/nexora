// NEXORA — Spanish translations (default locale).
//
// Keep keys flat with dot-notation for easy lookup. Only UI strings that
// should be translated live in here — page-specific long-form text stays in
// the page components for now (this is a "basic i18n" infrastructure).
export const es = {
  // Brand & global
  'brand.name': 'NEXORA',
  'brand.tagline': 'Importaciones inteligentes',
  'brand.description': 'Plataforma inteligente de importación desde China. Tú eliges el producto, nosotros nos encargamos del resto.',

  // Nav
  'nav.catalog': 'Catálogo',
  'nav.howItWorks': 'Cómo Funciona',
  'nav.about': 'Nosotros',
  'nav.blog': 'Blog',
  'nav.contact': 'Contacto',
  'nav.back': 'Volver',
  'nav.backHome': 'Volver al inicio',

  // Buttons
  'button.login': 'Iniciar sesión',
  'button.register': 'Registrarse',
  'button.logout': 'Cerrar sesión',
  'button.viewCatalog': 'Ver catálogo',
  'button.requestProduct': 'Solicitar producto personalizado',
  'button.addToCart': 'Añadir',
  'button.addedToCart': 'Añadido al carrito',
  'button.request': 'Solicitar',
  'button.see': 'Ver',
  'button.search': 'Buscar',
  'button.searchByImage': 'Buscar por imagen',
  'button.compare': 'Comparar',
  'button.quote': 'Solicitar cotización',
  'button.send': 'Enviar',
  'button.cancel': 'Cancelar',
  'button.close': 'Cerrar',
  'button.save': 'Guardar',
  'button.delete': 'Eliminar',

  // Hero / landing
  'hero.title1': 'Importa desde China',
  'hero.title2': 'nunca había sido tan fácil',
  'hero.subtitle': 'Tú eliges el producto. Nosotros nos encargamos del resto: buscar proveedores, negociar, comprar, importar y entregar.',

  // Catalog
  'catalog.title': 'Catálogo de productos importables',
  'catalog.subtitle': 'Productos verificados desde China con precios de fabricante. Tú eliges, nosotros importamos.',
  'catalog.searchPlaceholder': 'Buscar productos...',
  'catalog.allCategories': 'Todos',
  'catalog.filterByBrand': 'Filtrar por marca:',
  'catalog.allBrands': 'Todas las marcas',
  'catalog.productsAvailable': 'productos disponibles',
  'catalog.noProducts': 'No se encontraron productos',
  'catalog.loadMore': 'Cargar más productos',
  'catalog.seenAll': 'Has visto todos los',
  'catalog.loadingMore': 'Cargando más productos...',
  'catalog.badge.hot': 'Productos más solicitados',
  'catalog.compareMax': 'Máximo 4 productos para comparar',

  // Product detail
  'product.verified': 'Verificado',
  'product.shipping': 'DHL/FedEx',
  'product.featured': 'Destacado',
  'product.priceOnRequest': 'Precio bajo consulta',
  'product.includes': 'Incluye: producto + envío + aduana + IVA + margen 50%',
  'product.relatedProducts': 'Productos relacionados',
  'product.relatedSubtitle': 'También te puede interesar',
  'product.estimatedDelivery': 'Tiempo estimado de entrega',
  'product.quantity': 'Cantidad:',
  'product.addToCart': 'Añadir al carrito',
  'product.specs': 'Especificaciones',

  // Cart / wishlist
  'cart.title': 'Tu carrito',
  'cart.empty': 'Tu carrito está vacío',
  'cart.checkout': 'Finalizar compra',
  'cart.subtotal': 'Subtotal',
  'cart.total': 'Total',
  'wishlist.title': 'Favoritos',
  'wishlist.empty': 'Aún no tienes favoritos',

  // Footer
  'footer.legal': 'Legal',
  'footer.terms': 'Términos y condiciones',
  'footer.privacy': 'Política de privacidad',
  'footer.returns': 'Devoluciones y garantías',
  'footer.faq': 'Preguntas frecuentes',
  'footer.contact': 'Contacto',
  'footer.copyright': '© 2025 NEXORA Importaciones S.A.S. — NIT 901.234.567-8. Todos los derechos reservados.',

  // AI Chatbot
  'chatbot.title': 'NAIOS',
  'chatbot.subtitle': 'Asistente de NEXORA',
  'chatbot.greeting': '¡Hola! 👋 Soy NAIOS, tu asistente. ¿Cómo puedo ayudarte?',
  'chatbot.placeholder': 'Escribe tu mensaje...',
  'chatbot.quick.catalog': 'Ver catálogo',
  'chatbot.quick.trackOrder': 'Track my order',
  'chatbot.quick.payment': 'Métodos de pago',
  'chatbot.quick.human': 'Hablar con humano',
  'chatbot.thinking': 'Pensando...',

  // Toast / errors
  'toast.addedToCart': 'Añadido al carrito',
  'toast.addedToWishlist': 'Añadido a favoritos',
  'toast.removedFromWishlist': 'Removido de favoritos',
  'toast.linkCopied': 'Link copiado al portapapeles',
  'toast.rateLimited': 'Demasiadas solicitudes. Inténtalo de nuevo más tarde.',
  'toast.error': 'Algo salió mal',

  // Misc
  'common.loading': 'Cargando...',
  'common.currency': 'USD',
  'common.search': 'Buscar',
} as const

export type TranslationKey = keyof typeof es
