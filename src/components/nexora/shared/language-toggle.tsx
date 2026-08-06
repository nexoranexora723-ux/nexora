'use client'

/**
 * NEXORA — Language Toggle (ES/EN)
 */
import { useI18n } from '@/lib/i18n-store'
import { Button } from '@/components/ui/button'
import { Languages } from 'lucide-react'

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { locale, toggle } = useI18n()

  return (
    <Button
      variant="outline"
      size={compact ? 'sm' : 'default'}
      onClick={toggle}
      className="gap-2 font-semibold"
      title={locale === 'es' ? 'Switch to English' : 'Cambiar a Español'}
    >
      <Languages className="h-4 w-4" />
      {!compact && <span>{locale === 'es' ? 'ES' : 'EN'}</span>}
      {compact && <span>{locale.toUpperCase()}</span>}
    </Button>
  )
}
