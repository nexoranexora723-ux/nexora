// NEXORA — English translations (fallback locale).
//
// Only key UI strings are translated (basic i18n). Long-form marketing copy
// stays in Spanish for now.
import type { TranslationKey } from './es'

export const en: Record<TranslationKey, string> = {
  // Brand & global
  'brand.name': 'NEXORA',
  'brand.tagline': 'Smart imports',
  'brand.description': 'Smart import platform from China. You pick the product, we handle the rest.',

  // Nav
  'nav.catalog': 'Catalog',
  'nav.howItWorks': 'How it works',
  'nav.about': 'About us',
  'nav.blog': 'Blog',
  'nav.contact': 'Contact',
  'nav.back': 'Back',
  'nav.backHome': 'Back to home',

  // Buttons
  'button.login': 'Sign in',
  'button.register': 'Sign up',
  'button.logout': 'Sign out',
  'button.viewCatalog': 'View catalog',
  'button.requestProduct': 'Request a custom product',
  'button.addToCart': 'Add',
  'button.addedToCart': 'Added to cart',
  'button.request': 'Request',
  'button.see': 'View',
  'button.search': 'Search',
  'button.searchByImage': 'Search by image',
  'button.compare': 'Compare',
  'button.quote': 'Request quote',
  'button.send': 'Send',
  'button.cancel': 'Cancel',
  'button.close': 'Close',
  'button.save': 'Save',
  'button.delete': 'Delete',

  // Hero / landing
  'hero.title1': 'Importing from China',
  'hero.title2': 'has never been this easy.',
  'hero.subtitle': 'You pick the product. We handle the rest: find suppliers, negotiate, buy, import and deliver.',

  // Catalog
  'catalog.title': 'Importable products catalog',
  'catalog.subtitle': 'Verified products from China at factory prices. You pick, we import.',
  'catalog.searchPlaceholder': 'Search products...',
  'catalog.allCategories': 'All',
  'catalog.filterByBrand': 'Filter by brand:',
  'catalog.allBrands': 'All brands',
  'catalog.productsAvailable': 'products available',
  'catalog.noProducts': 'No products found',
  'catalog.loadMore': 'Load more products',
  'catalog.seenAll': "You've seen all",
  'catalog.loadingMore': 'Loading more products...',
  'catalog.badge.hot': 'Most requested products',
  'catalog.compareMax': 'Maximum 4 products to compare',

  // Product detail
  'product.verified': 'Verified',
  'product.shipping': 'DHL/FedEx',
  'product.featured': 'Featured',
  'product.priceOnRequest': 'Price on request',
  'product.includes': 'Includes: product + shipping + customs + VAT + 50% margin',
  'product.relatedProducts': 'Related products',
  'product.relatedSubtitle': 'You may also like',
  'product.estimatedDelivery': 'Estimated delivery time',
  'product.quantity': 'Quantity:',
  'product.addToCart': 'Add to cart',
  'product.specs': 'Specifications',

  // Cart / wishlist
  'cart.title': 'Your cart',
  'cart.empty': 'Your cart is empty',
  'cart.checkout': 'Checkout',
  'cart.subtotal': 'Subtotal',
  'cart.total': 'Total',
  'wishlist.title': 'Wishlist',
  'wishlist.empty': 'No favorites yet',

  // Footer
  'footer.legal': 'Legal',
  'footer.terms': 'Terms & conditions',
  'footer.privacy': 'Privacy policy',
  'footer.returns': 'Returns & warranty',
  'footer.faq': 'FAQ',
  'footer.contact': 'Contact',
  'footer.copyright': '© 2025 NEXORA Importaciones S.A.S. — NIT 901.234.567-8. All rights reserved.',

  // AI Chatbot
  'chatbot.title': 'NAIOS',
  'chatbot.subtitle': 'NEXORA assistant',
  'chatbot.greeting': "Hi! 👋 I'm NAIOS, your assistant. How can I help?",
  'chatbot.placeholder': 'Type your message...',
  'chatbot.quick.catalog': 'View catalog',
  'chatbot.quick.trackOrder': 'Track my order',
  'chatbot.quick.payment': 'Payment methods',
  'chatbot.quick.human': 'Talk to a human',
  'chatbot.thinking': 'Thinking...',

  // Toast / errors
  'toast.addedToCart': 'Added to cart',
  'toast.addedToWishlist': 'Added to favorites',
  'toast.removedFromWishlist': 'Removed from favorites',
  'toast.linkCopied': 'Link copied to clipboard',
  'toast.rateLimited': 'Too many requests. Please try again later.',
  'toast.error': 'Something went wrong',

  // Misc
  'common.loading': 'Loading...',
  'common.currency': 'USD',
  'common.search': 'Search',
}
