'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { es, type TranslationKey } from './translations/es'
import { en } from './translations/en'

export type Locale = 'es' | 'en'

export const locales: Locale[] = ['es', 'en']
export const defaultLocale: Locale = 'es'

interface I18nState {
  locale: Locale
  setLocale: (locale: Locale) => void
}

/**
 * Client-side locale store. Persists the user's choice in localStorage so
 * it survives reloads. Default is Spanish (the primary language of NEXORA).
 *
 * NOTE: This is a *basic* i18n infrastructure. It does NOT do per-route
 * locale switching or SSR translation. It's intended for live UI string
 * toggling in the navbar.
 */
export const useI18n = create<I18nState>()(
  persist(
    (set) => ({
      locale: defaultLocale,
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'nexora-locale',
      // Only persist the locale, not setter functions.
      partialize: (state) => ({ locale: state.locale }),
    },
  ),
)

const dictionaries: Record<Locale, Record<TranslationKey, string>> = {
  es,
  en,
}

/**
 * Translation function. Falls back to Spanish, then to the key itself.
 *
 * Usage:
 *   const t = useT()
 *   t('nav.catalog')  // → 'Catálogo' (es) or 'Catalog' (en)
 */
export function useT(): (key: TranslationKey) => string {
  const locale = useI18n((s) => s.locale)
  return (key: TranslationKey): string => {
    const dict = dictionaries[locale] ?? dictionaries[defaultLocale]
    return dict[key] ?? dictionaries[defaultLocale][key] ?? key
  }
}

/**
 * Server-side translation (no Zustand). Useful in Server Components.
 */
export function t(key: TranslationKey, locale: Locale = defaultLocale): string {
  const dict = dictionaries[locale] ?? dictionaries[defaultLocale]
  return dict[key] ?? dictionaries[defaultLocale][key] ?? key
}
