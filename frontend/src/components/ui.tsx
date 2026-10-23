/** Small shared UI primitives and formatting helpers. */

import { useEffect, useState, type ReactNode } from 'react'

export function fmtPct(v: number | null | undefined, digits = 1): string {
  if (v === null || v === undefined) return '—'
  return `${(v * 100).toFixed(digits)}%`
}

/** Smooth rolling number counter for telemetry metrics. */
export function AnimatedNumber({
  value,
  from = 0,
  duration = 650,
  decimals = 0,
  suffix = '',
  prefix = '',
}: {
  value: number
  from?: number
  duration?: number
  decimals?: number
  suffix?: string
  prefix?: string
}) {
  const [displayValue, setDisplayValue] = useState(from)

  useEffect(() => {
    const start = from
    const target = value
    const diff = target - start

    if (Math.abs(diff) < 0.0001) {
      setDisplayValue(target)
      return
    }

    let startTime: number | null = null
    let animationFrameId: number

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Smooth cubic ease out
      const ease = 1 - Math.pow(1 - progress, 3)
      const current = start + diff * ease
      setDisplayValue(current)

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step)
      } else {
        setDisplayValue(target)
      }
    }

    animationFrameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animationFrameId)
  }, [value, from, duration])

  return (
    <>
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </>
  )
}

export function SectionTitle({
  eyebrow,
  title,
  icon,
  tag,
  children,
}: {
  eyebrow?: string
  title: string
  icon?: ReactNode
  tag?: string
  children?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-abyss-700/60 pb-3.5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          {tag && (
            <span className="font-mono text-[9px] font-bold tracking-[0.18em] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-amber-400">
              {tag}
            </span>
          )}
          {eyebrow && (
            <div className="font-mono text-[10px] font-semibold tracking-[0.2em] text-signal-400 uppercase">
              {eyebrow}
            </div>
          )}
        </div>
        <h2 className="flex items-center gap-2.5 text-[15.5px] sm:text-[16px] font-bold tracking-tight text-ink-100">
          {icon && (
            <div className="grid size-7 place-items-center rounded-lg bg-signal-500/10 border border-signal-500/20 text-signal-400 shadow-[0_0_12px_rgba(6,182,212,0.1)]">
              {icon}
            </div>
          )}
          {title}
        </h2>
      </div>
      {children}
    </div>
  )
}

export function Panel({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`glass-card rounded-xl overflow-hidden ${className}`}
    >
      {children}
    </section>
  )
}

/** Chip with icon + label; used wherever status must not rely on color alone. */
export function StatusChip({
  tone,
  icon,
  label,
}: {
  tone: 'pass' | 'abort' | 'inconclusive' | 'neutral' | 'warn'
  icon: ReactNode
  label: string
}) {
  const tones: Record<string, string> = {
    pass: 'border-pass-400/50 bg-pass-400/15 text-pass-400 shadow-[0_0_14px_rgba(74,222,128,0.2)]',
    abort: 'border-eve-500/50 bg-eve-500/15 text-eve-400 shadow-[0_0_14px_rgba(239,68,68,0.2)]',
    inconclusive: 'border-warn-400/50 bg-warn-400/15 text-warn-400 shadow-[0_0_14px_rgba(251,191,36,0.18)]',
    warn: 'border-warn-400/50 bg-warn-400/15 text-warn-400 shadow-[0_0_14px_rgba(251,191,36,0.18)]',
    neutral: 'border-abyss-600 bg-abyss-800 text-ink-300',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold tracking-wide ${tones[tone]}`}
    >
      {icon}
      {label}
    </span>
  )
}

export function Metric({
  label,
  value,
  sub,
  mono = true,
  tag,
}: {
  label: string
  value: ReactNode
  sub?: string
  mono?: boolean
  tag?: string
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-1">
        <div className="font-mono text-[9.5px] font-semibold tracking-[0.16em] text-ink-500 uppercase">
          {label}
        </div>
        {tag && (
          <span className="font-mono text-[9px] text-amber-400/80 font-bold">
            {tag}
          </span>
        )}
      </div>
      <div
        className={`tnum mt-1 truncate text-xl font-bold tracking-tight text-ink-100 ${mono ? 'font-mono' : ''}`}
        title={typeof value === 'string' ? value : undefined}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[11px] text-ink-400">{sub}</div>}
    </div>
  )
}

