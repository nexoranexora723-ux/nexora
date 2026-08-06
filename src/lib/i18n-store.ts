/**
 * NEXORA — i18n Multi-idioma (ES/EN)
 *
 * Sistema simple de traducciones sin dependencias externas.
 * Soporta español (default) e inglés.
 * Persiste la preferencia en localStorage.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Locale = 'es' | 'en'

// ============================================================================
// TRADUCCIONES
// ============================================================================

export const translations = {
  es: {
    // Navbar
    'nav.home': 'Inicio',
    'nav.catalog': 'Catálogo',
    'nav.howItWorks': 'Cómo funciona',
    'nav.about': 'Nosotros',
    'nav.contact': 'Contacto',
    'nav.login': 'Iniciar sesión',
    'nav.register': 'Registrarse',
    'nav.account': 'Mi cuenta',
    'nav.logout': 'Cerrar sesión',

    // Landing
    'landing.heroTitle': 'Importa productos premium desde China',
    'landing.heroSubtitle': 'Lujo accesible, calidad garantizada, envío a toda Colombia',
    'landing.cta': 'Ver catálogo',
    'landing.ctaSecondary': 'Hablar con asesor',

    // Catalog
    'catalog.title': 'Catálogo de productos',
    'catalog.search': 'Buscar productos...',
    'catalog.filters': 'Filtros',
    'catalog.sortBy': 'Ordenar por',
    'catalog.priceRange': 'Rango de precio',
    'catalog.brand': 'Marca',
    'catalog.category': 'Categoría',
    'catalog.noResults': 'No se encontraron productos',
    'catalog.results': 'productos encontrados',
    'catalog.featured': 'Destacados',
    'catalog.newest': 'Más recientes',
    'catalog.priceLow': 'Precio: menor a mayor',
    'catalog.priceHigh': 'Precio: mayor a menor',
    'catalog.rating': 'Mejor calificados',

    // Product
    'product.addToCart': 'Agregar al carrito',
    'product.buyNow': 'Comprar ahora',
    'product.addToWishlist': 'Agregar a favoritos',
    'product.share': 'Compartir',
    'product.compare': 'Comparar',
    'product.sku': 'SKU',
    'product.brand': 'Marca',
    'product.category': 'Categoría',
    'product.availability': 'Disponibilidad',
    'product.inStock': 'En stock',
    'product.outOfStock': 'Agotado',
    'product.description': 'Descripción',
    'product.specs': 'Especificaciones',
    'product.reviews': 'Reseñas',
    'product.relatedProducts': 'Productos relacionados',

    // Cart
    'cart.title': 'Tu carrito',
    'cart.empty': 'Tu carrito está vacío',
    'cart.subtotal': 'Subtotal',
    'cart.shipping': 'Envío',
    'cart.tax': 'Impuestos',
    'cart.total': 'Total',
    'cart.checkout': 'Finalizar compra',
    'cart.continueShopping': 'Seguir comprando',
    'cart.remove': 'Eliminar',
    'cart.quantity': 'Cantidad',

    // Checkout
    'checkout.title': 'Finalizar compra',
    'checkout.step1': 'Información de envío',
    'checkout.step2': 'Método de pago',
    'checkout.step3': 'Revisar pedido',
    'checkout.step4': 'Confirmación',
    'checkout.fullName': 'Nombre completo',
    'checkout.email': 'Email',
    'checkout.phone': 'Teléfono',
    'checkout.address': 'Dirección',
    'checkout.city': 'Ciudad',
    'checkout.zipCode': 'Código postal',
    'checkout.paymentMethod': 'Método de pago',
    'checkout.placeOrder': 'Confirmar pedido',

    // Footer
    'footer.about': 'Sobre NEXORA',
    'footer.help': 'Ayuda',
    'footer.legal': 'Legal',
    'footer.contact': 'Contacto',
    'footer.privacy': 'Privacidad',
    'footer.terms': 'Términos',
    'footer.refunds': 'Devoluciones',
    'footer.faq': 'Preguntas frecuentes',
    'footer.newsletter': 'Newsletter',
    'footer.followUs': 'Síguenos',

    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.close': 'Cerrar',
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.clear': 'Limpiar',
    'common.apply': 'Aplicar',
    'common.viewAll': 'Ver todo',
    'common.viewMore': 'Ver más',
    'common.back': 'Volver',
    'common.next': 'Siguiente',
    'common.previous': 'Anterior',
  },

  en: {
    // Navbar
    'nav.home': 'Home',
    'nav.catalog': 'Catalog',
    'nav.howItWorks': 'How it works',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.account': 'My account',
    'nav.logout': 'Logout',

    // Landing
    'landing.heroTitle': 'Import premium products from China',
    'landing.heroSubtitle': 'Affordable luxury, guaranteed quality, shipping throughout Colombia',
    'landing.cta': 'View catalog',
    'landing.ctaSecondary': 'Talk to an advisor',

    // Catalog
    'catalog.title': 'Product catalog',
    'catalog.search': 'Search products...',
    'catalog.filters': 'Filters',
    'catalog.sortBy': 'Sort by',
    'catalog.priceRange': 'Price range',
    'catalog.brand': 'Brand',
    'catalog.category': 'Category',
    'catalog.noResults': 'No products found',
    'catalog.results': 'products found',
    'catalog.featured': 'Featured',
    'catalog.newest': 'Newest',
    'catalog.priceLow': 'Price: low to high',
    'catalog.priceHigh': 'Price: high to low',
    'catalog.rating': 'Top rated',

    // Product
    'product.addToCart': 'Add to cart',
    'product.buyNow': 'Buy now',
    'product.addToWishlist': 'Add to wishlist',
    'product.share': 'Share',
    'product.compare': 'Compare',
    'product.sku': 'SKU',
    'product.brand': 'Brand',
    'product.category': 'Category',
    'product.availability': 'Availability',
    'product.inStock': 'In stock',
    'product.outOfStock': 'Out of stock',
    'product.description': 'Description',
    'product.specs': 'Specifications',
    'product.reviews': 'Reviews',
    'product.relatedProducts': 'Related products',

    // Cart
    'cart.title': 'Your cart',
    'cart.empty': 'Your cart is empty',
    'cart.subtotal': 'Subtotal',
    'cart.shipping': 'Shipping',
    'cart.tax': 'Tax',
    'cart.total': 'Total',
    'cart.checkout': 'Checkout',
    'cart.continueShopping': 'Continue shopping',
    'cart.remove': 'Remove',
    'cart.quantity': 'Quantity',

    // Checkout
    'checkout.title': 'Checkout',
    'checkout.step1': 'Shipping information',
    'checkout.step2': 'Payment method',
    'checkout.step3': 'Review order',
    'checkout.step4': 'Confirmation',
    'checkout.fullName': 'Full name',
    'checkout.email': 'Email',
    'checkout.phone': 'Phone',
    'checkout.address': 'Address',
    'checkout.city': 'City',
    'checkout.zipCode': 'Zip code',
    'checkout.paymentMethod': 'Payment method',
    'checkout.placeOrder': 'Place order',

    // Footer
    'footer.about': 'About NEXORA',
    'footer.help': 'Help',
    'footer.legal': 'Legal',
    'footer.contact': 'Contact',
    'footer.privacy': 'Privacy',
    'footer.terms': 'Terms',
    'footer.refunds': 'Refunds',
    'footer.faq': 'FAQ',
    'footer.newsletter': 'Newsletter',
    'footer.followUs': 'Follow us',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.clear': 'Clear',
    'common.apply': 'Apply',
    'common.viewAll': 'View all',
    'common.viewMore': 'View more',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
  },
} as const

// ============================================================================
// STORE
// ============================================================================

interface I18nState {
  locale: Locale
  setLocale: (locale: Locale) => void
  toggle: () => void
  t: (key: string, params?: Record<string, string | number>) => string
}

export const useI18n = create<I18nState>()(
  persist(
    (set, get) => ({
      locale: 'es',
      setLocale: (locale) => set({ locale }),
      toggle: () => set((s) => ({ locale: s.locale === 'es' ? 'en' : 'es' })),

      t: (key, params) => {
        const { locale } = get()
        const dict = translations[locale] as Record<string, string>
        let text = dict[key] ?? translations.es[key] ?? key

        if (params) {
          for (const [k, v] of Object.entries(params)) {
            text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
          }
        }
        return text
      },
    }),
    {
      name: 'nexora-locale',
      version: 1,
    }
  )
)
