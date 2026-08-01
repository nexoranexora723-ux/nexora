'use client'

import { Globe, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useI18n, type Locale } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const LOCALE_LABELS: Record<Locale, { label: string; flag: string; native: string }> = {
  es: { label: 'Spanish', flag: '🇪🇸', native: 'Español' },
  en: { label: 'English', flag: '🇺🇸', native: 'English' },
}

/**
 * Language toggle button (globe icon). Stored in localStorage via useI18n.
 * Shows a dropdown with available locales and marks the active one.
 */
export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const locale = useI18n((s) => s.locale)
  const setLocale = useI18n((s) => s.setLocale)
  const current = LOCALE_LABELS[locale]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={compact ? 'icon' : 'sm'}
          className="gap-1.5"
          aria-label="Cambiar idioma"
        >
          <Globe className="h-4 w-4" />
          {!compact && <span className="text-xs uppercase">{locale}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {current.flag} Idioma
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(LOCALE_LABELS) as Locale[]).map((loc) => {
          const info = LOCALE_LABELS[loc]
          return (
            <DropdownMenuItem
              key={loc}
              onClick={() => setLocale(loc)}
              className={cn(
                'flex cursor-pointer items-center justify-between gap-2',
                locale === loc && 'bg-accent',
              )}
            >
              <span className="flex items-center gap-2">
                <span aria-hidden>{info.flag}</span>
                <span>{info.native}</span>
              </span>
              {locale === loc && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
