'use client'

import { useState, useEffect, useRef } from 'react'

// === Typewriter effect for NAIOS responses ===
export function TypewriterText({ text, speed = 15, onComplete }: { text: string; speed?: number; onComplete?: () => void }) {
  const [displayed, setDisplayed] = useState('')
  const [isTyping, setIsTyping] = useState(true)
  const indexRef = useRef(0)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayed('')
    setIsTyping(true)
    indexRef.current = 0

    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayed(text.slice(0, indexRef.current + 1))
        indexRef.current++
      } else {
        clearInterval(interval)
        setIsTyping(false)
        onComplete?.()
      }
    }, speed)

    return () => clearInterval(interval)
  }, [text, speed, onComplete])

  return (
    <span>
      {displayed}
      {isTyping && <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-primary" />}
    </span>
  )
}
