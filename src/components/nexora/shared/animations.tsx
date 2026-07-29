'use client'

import confetti from 'canvas-confetti'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'
import { CheckCircle2, Loader2, Sparkles, ShoppingCart } from 'lucide-react'

// === #1 Confeti al crear solicitud ===
export function fireConfetti() {
  const colors = ['#10b981', '#0ea5e9', '#8b5cf6', '#f59e0b', '#f43f5e']
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors,
    zIndex: 9999,
  })
  setTimeout(() => {
    confetti({ particleCount: 40, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors, zIndex: 9999 })
  }, 200)
  setTimeout(() => {
    confetti({ particleCount: 40, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors, zIndex: 9999 })
  }, 400)
}

export function fireConfettiSmall() {
  confetti({
    particleCount: 30,
    spread: 45,
    origin: { y: 0.7 },
    zIndex: 9999,
    scalar: 0.8,
    colors: ['#10b981', '#f59e0b', '#0ea5e9'],
  })
}

// === #2 Pantalla de éxito con check animado ===
export function SuccessOverlay({ show, title, subtitle, onDone }: { show: boolean; title: string; subtitle: string; onDone: () => void }) {
  useEffect(() => {
    if (show) {
      fireConfetti()
      const timer = setTimeout(onDone, 3000)
      return () => clearTimeout(timer)
    }
  }, [show, onDone])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="flex flex-col items-center rounded-3xl bg-card p-10 shadow-2xl"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.2 }}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950"
            >
              <motion.svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                initial="hidden"
                animate="visible"
              >
                <motion.path
                  d="M14 24 L21 31 L34 16"
                  stroke="#10b981"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  variants={{ hidden: { pathLength: 0, opacity: 0 }, visible: { pathLength: 1, opacity: 1 } }}
                  transition={{ duration: 0.5, delay: 0.4, ease: 'easeInOut' }}
                />
              </motion.svg>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-5 text-xl font-bold"
            >
              {title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-1 text-sm text-muted-foreground"
            >
              {subtitle}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// === #3 Contador animado ===
export function AnimatedCounter({ value, prefix = '', suffix = '', decimals = 0 }: { value: number; prefix?: string; suffix?: string; decimals?: number }) {
  const [displayValue, setDisplayValue] = useState(0)
  const prevValue = useRef(0)

  useEffect(() => {
    const start = prevValue.current
    const end = value
    const duration = 800
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      const current = start + (end - start) * eased
      setDisplayValue(current)
      if (progress < 1) requestAnimationFrame(animate)
      else prevValue.current = end
    }
    requestAnimationFrame(animate)
  }, [value])

  const formatted = decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue).toString()
  return <span className="tabular-nums">{prefix}{formatted}{suffix}</span>
}

// === #4 Carrito volando ===
export function FlyingCart({ trigger, fromRect, toRect, onDone }: { trigger: boolean; fromRect: DOMRect | null; toRect: DOMRect | null; onDone: () => void }) {
  return (
    <AnimatePresence onExitComplete={onDone}>
      {trigger && fromRect && toRect && (
        <motion.div
          initial={{ x: fromRect.x + fromRect.width / 2 - 15, y: fromRect.y + fromRect.height / 2 - 15, scale: 1, opacity: 1 }}
          animate={{ x: toRect.x + toRect.width / 2 - 15, y: toRect.y + toRect.height / 2 - 15, scale: 0.5, opacity: 0.3 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="pointer-events-none fixed left-0 top-0 z-[9999] flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
        >
          <ShoppingCart className="h-4 w-4" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// === #5 Pantalla de carga con logo pulsando ===
export function LoadingOverlay({ show, message }: { show: boolean; message: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-4">
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground shadow-2xl"
            >
              <span className="text-2xl font-black">N</span>
            </motion.div>
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-sm text-white/80"
            >
              {message}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// === #6 Stagger de productos al cargar ===
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
}

// === #10 Badge que pulsa ===
export function PulsingBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.span
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      className={className}
    >
      {children}
    </motion.span>
  )
}

// === #12 Sidebar indicator ===
export function SidebarIndicator({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          layoutId="sidebar-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-primary"
        />
      )}
    </AnimatePresence>
  )
}

// === #15 Notificación que se desliza ===
export const slideInFromTop = {
  hidden: { opacity: 0, y: -20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 30 } },
  exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } },
}

// === #16 Badge que hace pop ===
export function PopBadge({ count, children }: { count: number; children: React.ReactNode }) {
  return (
    <motion.div
      key={count}
      initial={{ scale: 0.5 }}
      animate={{ scale: [0.5, 1.3, 1] }}
      transition={{ duration: 0.4, type: 'spring' }}
    >
      {children}
    </motion.div>
  )
}

// === #23 NAIOS avatar que respira ===
export function BreathingAvatar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      animate={{ scale: [1, 1.03, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// === #24 Typing indicator elegante ===
export function NaiosTyping() {
  const colors = ['#10b981', '#0ea5e9', '#8b5cf6']
  return (
    <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-muted/60 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
          className="h-2 w-2 rounded-full"
          style={{ background: colors[i] }}
        />
      ))}
    </div>
  )
}

// === #25 Mensaje con slide ===
export const messageSlideIn = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 28 } },
}

// === #27 Botón con ripple ===
export function RippleButton({ children, onClick, className, variant = 'default', size }: { children: React.ReactNode; onClick?: () => void; className?: string; variant?: 'default' | 'outline' | 'ghost'; size?: 'sm' | 'md' | 'lg' }) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()
    setRipples((r) => [...r, { x, y, id }])
    setTimeout(() => setRipples((r) => r.filter((rip) => rip.id !== id)), 600)
    onClick?.()
  }

  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border bg-background hover:bg-muted',
    ghost: 'hover:bg-muted',
  }
  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-10 px-6 text-base',
  }

  return (
    <button
      onClick={handleClick}
      className={cn('relative overflow-hidden rounded-lg font-medium transition-colors', variants[variant], sizes[size ?? 'md'], className)}
    >
      {children}
      {ripples.map((r) => (
        <motion.span
          key={r.id}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="pointer-events-none absolute rounded-full bg-white/30"
          style={{ left: r.x - 50, top: r.y - 50, width: 100, height: 100 }}
        />
      ))}
    </button>
  )
}

// === #34 Timeline que se llena ===
export function AnimatedTimeline({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const progress = (currentStep / totalSteps) * 100
  return (
    <motion.div
      className="absolute left-0 top-4 h-0.5 bg-primary"
      initial={{ width: 0 }}
      animate={{ width: `${progress}%` }}
      transition={{ duration: 0.8, ease: 'easeOutCubic' }}
    />
  )
}

import { cn } from '@/lib/utils'
