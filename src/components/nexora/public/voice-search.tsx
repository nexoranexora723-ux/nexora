'use client'

/**
 * NEXORA — Voice Search
 * Componente de búsqueda por voz usando Web Speech API.
 * Funciona en Chrome, Edge, Safari (iOS 14.5+).
 */
import { useState, useRef, useEffect, useMemo } from 'react'
import { Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type SpeechRecognitionType = any
type SpeechRecognitionEvent = any

interface VoiceSearchProps {
  onResult: (transcript: string) => void
  className?: string
  compact?: boolean
}

export function VoiceSearch({ onResult, className, compact = false }: VoiceSearchProps) {
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState('')
  const recognitionRef = useRef<SpeechRecognitionType>(null)

  // Detectar soporte sin setState en effect
  const isSupported = useMemo(() => {
    if (typeof window === 'undefined') return false
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
  }, [])

  useEffect(() => {
    if (!isSupported) return

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    const recognition = new SpeechRecognition()
    recognition.lang = 'es-ES'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript
      onResult(transcript)
      setIsListening(false)
    }

    recognition.onerror = (event: any) => {
      setError(
        event.error === 'not-allowed'
          ? 'Permiso denegado. Habilita el micrófono en tu navegador.'
          : event.error === 'no-speech'
          ? 'No detecté audio. Intenta de nuevo.'
          : 'Error en reconocimiento de voz.'
      )
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
  }, [isSupported, onResult])

  const toggleListening = () => {
    if (!isSupported || !recognitionRef.current) return
    setError('')

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch {
        setError('No se pudo iniciar el micrófono.')
      }
    }
  }

  if (!isSupported) {
    return null
  }

  return (
    <div className={cn('relative', className)}>
      <Button
        type="button"
        variant="ghost"
        size={compact ? 'sm' : 'default'}
        onClick={toggleListening}
        className={cn(
          'gap-2 transition-all',
          isListening && 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
        )}
        title={isListening ? 'Detener' : 'Buscar por voz'}
        aria-label={isListening ? 'Detener búsqueda por voz' : 'Iniciar búsqueda por voz'}
      >
        {isListening ? (
          <>
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
              <span className="relative inline-flex h-3 w-3 items-center justify-center rounded-full bg-rose-500" />
            </span>
            {!compact && <span className="text-xs">Escuchando...</span>}
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" />
            {!compact && <span className="text-xs">Voz</span>}
          </>
        )}
      </Button>
      {error && (
        <div className="absolute top-full right-0 mt-2 w-56 rounded-md bg-destructive px-3 py-2 text-xs text-destructive-foreground shadow-lg z-50">
          {error}
        </div>
      )}
    </div>
  )
}
