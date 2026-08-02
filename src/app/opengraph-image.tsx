import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export const alt = 'NEXORA — Importa desde China fácilmente'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * Dynamic Open Graph image for NEXORA.
 *
 * Renders the NEXORA logo (gradient square with "N") + tagline
 * "Importa desde China fácilmente" over a blue gradient background.
 *
 * Used automatically by Next.js Metadata API for og:image on every page
 * (unless overridden by a page-level opengraph-image).
 */
export default async function OpengraphImage(_req: NextRequest) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px',
          background:
            'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1d4ed8 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Decorative grid pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.08,
            backgroundImage:
              'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            display: 'flex',
          }}
        />
        {/* Logo row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginBottom: 40 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 64,
              fontWeight: 900,
              color: '#1d4ed8',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            }}
          >
            N
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 56, fontWeight: 900, letterSpacing: -1, lineHeight: 1 }}>
              NEXORA
            </div>
            <div style={{ fontSize: 22, fontWeight: 500, opacity: 0.85, marginTop: 4 }}>
              Importaciones inteligentes
            </div>
          </div>
        </div>

        {/* Main tagline */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: -2,
            maxWidth: 900,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span>Importa desde China</span>
          <span style={{ color: '#bfdbfe' }}>fácilmente.</span>
        </div>

        {/* Sub-text */}
        <div
          style={{
            marginTop: 32,
            fontSize: 28,
            opacity: 0.9,
            maxWidth: 850,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          Tú eliges el producto. Nosotros nos encargamos del resto:
          proveedores, logística, aduana y entrega.
        </div>

        {/* Bottom badges */}
        <div
          style={{
            marginTop: 60,
            display: 'flex',
            gap: 24,
            fontSize: 22,
            fontWeight: 600,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.15)', padding: '12px 24px', borderRadius: 999 }}>
            ✓ Proveedores verificados
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.15)', padding: '12px 24px', borderRadius: 999 }}>
            🚚 Logística completa
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.15)', padding: '12px 24px', borderRadius: 999 }}>
            ⚡ Proceso automatizado
          </div>
        </div>

        {/* URL footer */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            right: 80,
            fontSize: 24,
            opacity: 0.7,
            fontWeight: 600,
            display: 'flex',
          }}
        >
          nexora.co
        </div>
      </div>
    ),
    { ...size },
  )
}
