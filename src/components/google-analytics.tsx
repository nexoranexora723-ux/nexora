'use client'

import Script from 'next/script'

/**
 * GoogleAnalytics — Carga condicional de Google Analytics 4.
 *
 * Solo se renderiza si `NEXT_PUBLIC_GA_ID` está definido (e.g. "G-XXXXXXXXXX").
 * Usa next/script con strategy="afterInteractive" para no bloquear el render.
 *
 * Configura tu measurement ID en `.env`:
 *   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
 */
export function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID
  if (!gaId) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="nexora-ga4" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  )
}
