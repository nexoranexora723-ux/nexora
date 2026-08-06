'use client'

/**
 * NEXORA — Social Login Buttons (Google/Facebook/GitHub)
 * Muestra botones para login con OAuth.
 * Requiere configuración de variables de entorno para cada provider.
 */
import { Button } from '@/components/ui/button'
import { OAUTH_PROVIDERS, buildOAuthUrl } from '@/lib/security'
import { motion } from 'framer-motion'

export function SocialLoginButtons({ compact = false }: { compact?: boolean }) {
  const handleLogin = (provider: 'google' | 'facebook' | 'github') => {
    const url = buildOAuthUrl(provider)
    // Si no hay client_id configurado, mostrar aviso
    if (url.includes('client_id=&')) {
      alert(
        `Login con ${provider} no está configurado aún.\n\n` +
        `Para habilitarlo:\n` +
        `1. Ve a Vercel → Settings → Environment Variables\n` +
        `2. Agrega NEXT_PUBLIC_${provider.toUpperCase()}_CLIENT_ID\n` +
        `3. Redeploy`
      )
      return
    }
    // Redirigir a la URL de OAuth
    if (typeof window !== 'undefined') {
      window.location.assign(url)
    }
  }

  if (compact) {
    return (
      <div className="flex gap-2">
        {OAUTH_PROVIDERS.map((p) => (
          <button
            key={p.id}
            onClick={() => handleLogin(p.id)}
            className="flex h-10 w-10 items-center justify-center rounded-full border transition-colors hover:bg-muted"
            style={{ color: p.color }}
            title={`Continuar con ${p.name}`}
            aria-label={`Continuar con ${p.name}`}
          >
            <span className="text-lg">{p.icon}</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            o continúa con
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {OAUTH_PROVIDERS.map((p, idx) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => handleLogin(p.id)}
              className="w-full gap-2"
              style={{ color: p.color }}
            >
              <span className="text-base">{p.icon}</span>
              <span className="text-xs hidden sm:inline">{p.name}</span>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
