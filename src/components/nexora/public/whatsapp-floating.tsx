'use client'

import * as React from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

/**
 * WhatsApp floating button — visible on ALL pages.
 *
 * - Fixed bottom-right, sits ABOVE the AI chatbot button.
 * - Green WhatsApp brand color (#25D366) with a custom SVG icon.
 * - Subtle pulse animation ring to attract attention without being annoying.
 * - Tooltip on hover: "¿Tienes dudas? Escríbenos".
 * - Responsive: smaller (h-12 w-12) on mobile, larger (h-14 w-14) on sm+.
 * - Clicking opens a pre-filled WhatsApp chat with the NEXORA business number.
 */
const WHATSAPP_NUMBER = '573105550100'
const WHATSAPP_MESSAGE = 'Hola NEXORA, quiero hacer una consulta'
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`

export function WhatsAppFloating() {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Escribir por WhatsApp"
            className="group fixed bottom-20 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/40 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 sm:bottom-24 sm:right-6 sm:h-14 sm:w-14"
          >
            {/* Pulse ring */}
            <span
              aria-hidden
              className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-30 group-hover:opacity-0 motion-reduce:animate-none"
            />
            {/* WhatsApp SVG icon */}
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="relative h-6 w-6 sm:h-7 sm:w-7"
              aria-hidden="true"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.892c0 2.096.549 4.142 1.595 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.582 0 11.94-5.335 11.945-11.893a11.821 11.821 0 00-3.487-8.453" />
            </svg>
            {/* Online indicator dot */}
            <span
              aria-hidden
              className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400 motion-reduce:hidden"
            />
          </a>
        </TooltipTrigger>
        <TooltipContent side="left" className="font-medium">
          ¿Tienes dudas? Escríbenos
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
