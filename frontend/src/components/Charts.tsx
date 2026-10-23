import { useRef, useState, useEffect } from 'react'
import { Activity, BarChart3, Gauge, Play, RefreshCw } from 'lucide-react'
import type { SimulateResult } from '../types'
import { fmtPct } from './ui'

/**
 * Horizontal QBER gauge with three separate markers:
 *  - the observed QBER of this run (needle)
 *  - the configured abort threshold (tick)
 *  - the idealized ~11% theoretical reference and 25% full-intercept expectation
 */
export function QberGauge({ result }: { result: SimulateResult }) {
  const qber = result.decision.qber_observed
  const threshold = result.decision.threshold_configured
  const theoretical = result.decision.theoretical_reference
  const fullIntercept = result.decision.expected_full_intercept_qber
  const scaleMax = Math.max(0.3, threshold * 1.5, fullIntercept * 1.1)
  const pos = (v: number) => `${Math.min(100, (v / scaleMax) * 100)}%`

  const isSafe = qber !== null && qber <= threshold

  return (
    <div className="glass-card rounded-xl p-4 sm:p-6 fade-in-up">
      <div className="mb-5 sm:mb-6 flex items-center justify-between border-b border-abyss-700/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] font-bold tracking-[0.2em] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-amber-400">
            SPECTRUM
          </span>
          <h3 className="flex items-center gap-2 text-[14px] sm:text-[14.5px] font-bold tracking-tight text-ink-100">
            <Gauge className="size-4 text-signal-400" aria-hidden />
            QBER Telemetry vs. Security Bounds
          </h3>
        </div>
        <span className="font-mono text-[11px] text-ink-400 font-semibold px-2 py-0.5 rounded bg-black/30 border border-abyss-700/60">
          SCALE: 0–{fmtPct(scaleMax, 0)}
        </span>
      </div>

      <div className="relative mt-8 mb-6 sm:mb-7 h-14">
        {/* Track background with danger zone */}
        <div className="absolute inset-x-0 top-5 h-3 rounded-full bg-gradient-to-r from-abyss-800 via-abyss-800 to-eve-500/20 border border-abyss-700/70 overflow-hidden" />

        {/* Region below threshold (safe acceptable band) */}
        <div
          className="absolute top-5 h-3 rounded-l-full bg-gradient-to-r from-pass-400/40 via-signal-400/50 to-warn-400/40 border-r border-warn-400 shadow-[0_0_12px_rgba(34,211,238,0.2)]"
          style={{ width: pos(threshold) }}
        />

        {/* Markers */}
        <Marker x={pos(threshold)} label={`Abort: ${fmtPct(threshold)}`} color="bg-warn-400 text-warn-400" position="top" />
        <Marker x={pos(theoretical)} label={`~${fmtPct(theoretical, 0)} Shor–Preskill`} color="bg-signal-400 text-signal-300" dashed position="bottom" />
        <Marker x={pos(fullIntercept)} label={`${fmtPct(fullIntercept, 0)} Full Eve`} color="bg-eve-400 text-eve-400" dashed position="top" />

        {/* Observed needle with glowing radar pulse */}
        {qber !== null && (
          <div
            className="absolute top-2.5 -translate-x-1/2 transition-all duration-700 z-20"
            style={{ left: pos(qber) }}
          >
            <div className="relative flex items-center justify-center">
              <span
                className={`absolute -inset-1 rounded-full animate-ping opacity-75 ${
                  isSafe ? 'bg-pass-400' : 'bg-eve-500'
                }`}
              />
              <div
                className={`relative size-8 rounded-full border-2 border-abyss-950 shadow-2xl flex items-center justify-center transition-transform hover:scale-125 ${
                  isSafe
                    ? 'bg-pass-400 shadow-[0_0_20px_rgba(74,222,128,0.8)]'
                    : 'bg-eve-500 shadow-[0_0_20px_rgba(239,68,68,0.8)]'
                }`}
              >
                <div className="size-2.5 rounded-full bg-abyss-950" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2.5 border-t border-abyss-700/50 text-[11.5px] sm:text-[12px]">
        <span className="font-mono text-ink-400 flex items-center gap-2">
          <span
            className={`size-2 rounded-full ${
              qber === null ? 'bg-ink-500' : isSafe ? 'bg-pass-400 animate-pulse' : 'bg-eve-400 animate-pulse'
            }`}
          />
          <span className="text-ink-500 uppercase tracking-widest text-[10px]">VERDICT:</span>{' '}
          <strong className={isSafe ? 'text-pass-400 font-bold' : 'text-eve-400 font-bold'}>
            {qber === null ? 'NO MEASUREMENT' : isSafe ? 'WITHIN TOLERANCE (KEY SAFE)' : 'THRESHOLD EXCEEDED (INTRUSION)'}
          </strong>
        </span>
        <span className="font-mono text-ink-200 font-bold px-2 py-0.5 rounded bg-black/40 border border-abyss-700/60">
          OBSERVED: {qber !== null ? fmtPct(qber) : '—'}
        </span>
      </div>
    </div>
  )
}

function Marker({
  x,
  label,
  color,
  dashed = false,
  position = 'top',
}: {
  x: string
  label: string
  color: string
  dashed?: boolean
  position?: 'top' | 'bottom'
}) {
  return (
    <div className="absolute top-1 h-11 -translate-x-1/2 z-10" style={{ left: x }}>
      <div
        className={`h-11 w-0.5 ${dashed ? 'opacity-70' : 'opacity-100'} ${color.split(' ')[0]}`}
        style={
          dashed
            ? {
                backgroundImage: `repeating-linear-gradient(to bottom, currentColor 0 3px, transparent 3px 6px)`,
                backgroundColor: 'transparent',
              }
            : undefined
        }
      />
      <div
        className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded bg-abyss-950/90 border border-abyss-700/60 shadow-sm ${
          position === 'top' ? '-top-6' : 'top-10'
        } ${color.split(' ')[1]}`}
      >
        {label}
      </div>
    </div>
  )
}

/**
 * Key attrition across protocol stages — a single horizontal flow built
 * from the run's actual counts.
 */
export function AttritionChart({ result }: { result: SimulateResult }) {
  const n = result.config.n_photons
  const stages = [
    { label: 'Photons Sent', value: n, note: 'Alice\u2019s raw transmission', pct: 100 },
    {
      label: 'Sifted (Bases Matched)',
      value: result.sifted_count,
      note: 'After public basis comparison',
      pct: Math.round((result.sifted_count / n) * 100),
    },
    {
      label: 'Revealed in Test',
      value: result.estimation.sample_size,
      note: 'Sacrificed for QBER estimation',
      pct: Math.round((result.estimation.sample_size / n) * 100),
      warn: true,
    },
    {
      label: 'Retained Key Bits',
      value: result.retained_key.length_bits,
      note: 'Usable secret key material',
      pct: Math.round((result.retained_key.length_bits / n) * 100),
      success: true,
    },
  ]
  const max = Math.max(...stages.map((s) => s.value), 1)

  return (
    <div className="glass-card rounded-xl p-4 sm:p-6 fade-in-up">
      <div className="mb-5 sm:mb-6 flex items-center justify-between border-b border-abyss-700/50 pb-3">
        <h3 className="flex items-center gap-2.5 text-[14px] sm:text-[14.5px] font-bold tracking-tight text-ink-100">
          <div className="grid size-7 place-items-center rounded-lg bg-signal-500/10 border border-signal-500/20 text-signal-400">
            <Activity className="size-4" aria-hidden />
          </div>
          Key Attrition Through Protocol
        </h3>
        <span className="font-mono text-xs text-ink-400 font-semibold">{n} Total Photons</span>
      </div>

      <div className="space-y-4">
        {stages.map((s, i) => (
          <div key={s.label} className="rounded-lg border border-abyss-700/40 bg-abyss-850/40 p-3">
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="text-[12.5px] font-semibold text-ink-200">
                <span className="tnum mr-2 font-mono text-[10.5px] text-signal-400 font-bold">
                  0{i + 1}
                </span>
                {s.label}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-ink-500">
                  {s.pct}% of total
                </span>
                <span className="tnum font-mono text-sm font-bold text-ink-100">
                  {s.value}
                </span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-abyss-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  s.warn
                    ? 'bg-gradient-to-r from-warn-400 to-amber-500'
                    : s.success
                      ? 'bg-gradient-to-r from-pass-400 to-emerald-500 shadow-[0_0_8px_rgba(74,222,128,0.4)]'
                      : 'bg-gradient-to-r from-signal-500 to-signal-400'
                }`}
                style={{ width: `${(s.value / max) * 100}%` }}
              />
            </div>
            <div className="mt-1 text-[11px] text-ink-500">{s.note}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** QBER across repeated seeded trials — demonstrates the statistics of Eve. */
export function QberTrials({ baseConfig }: { baseConfig: SimulateResult['config'] }) {
  const [trials, setTrials] = useState<{ qber: number; eve: boolean }[]>([])
  const [busy, setBusy] = useState(false)
  const cancelled = useRef(false)

  useEffect(() => () => { cancelled.current = true }, [])

  async function runTrials() {
    setBusy(true)
    cancelled.current = false
    const out: { qber: number; eve: boolean }[] = []
    for (let i = 0; i < 12; i++) {
      const eve = i % 2 === 0
      try {
        const res = await fetch('/api/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...baseConfig,
            seed: 9000 + i,
            eve_enabled: eve,
            interception_rate: eve ? 1.0 : 0,
            message: null,
          }),
        })
        const data = await res.json()
        if (data.estimation.qber !== null) out.push({ qber: data.estimation.qber, eve })
      } catch {
        /* leave trials as they are */
      }
      if (cancelled.current) return
      setTrials([...out])
    }
    setBusy(false)
  }

  const maxQ = Math.max(0.3, ...trials.map((t) => t.qber))

  return (
    <div className="glass-card rounded-xl p-4 sm:p-6 fade-in-up">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-abyss-700/50 pb-3">
        <h3 className="flex items-center gap-2.5 text-[14.5px] font-bold tracking-tight text-ink-100">
          <div className="grid size-7 place-items-center rounded-lg bg-signal-500/10 border border-signal-500/20 text-signal-400">
            <BarChart3 className="size-4" aria-hidden />
          </div>
          QBER Across 12 Seeded Trials
        </h3>
        <button
          type="button"
          onClick={runTrials}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-abyss-600 bg-abyss-800/60 px-3 py-1.5 font-mono text-[11px] font-semibold text-ink-300 transition-all hover:border-signal-500/50 hover:text-signal-300 disabled:opacity-50"
        >
          {busy ? (
            <>
              <RefreshCw className="size-3 animate-spin text-signal-400" aria-hidden />
              Sampling…
            </>
          ) : (
            <>
              <Play className="size-3 text-signal-400" aria-hidden />
              Run 12 Trials
            </>
          )}
        </button>
      </div>

      {trials.length === 0 ? (
        <p className="text-[12.5px] leading-relaxed text-ink-400">
          Run 12 alternating seeded experiments (Eve off vs. 100% intercept) to observe how
          the distributions separate: <strong className="text-signal-300">near 0% without Eve</strong>, and <strong className="text-eve-400">clustered near 25% with Eve</strong>.
        </p>
      ) : (
        <div className="flex h-36 items-end gap-2 pt-2">
          {trials.map((t, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5 h-full justify-end group">
              <div
                className={`w-full rounded-md transition-all duration-300 group-hover:brightness-125 ${
                  t.eve
                    ? 'bg-gradient-to-t from-eve-600 to-eve-400 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                    : 'bg-gradient-to-t from-signal-600 to-signal-400 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                }`}
                style={{ height: `${Math.max(4, (t.qber / maxQ) * 100)}%` }}
                title={`Trial #${i + 1}: QBER ${fmtPct(t.qber)} · Eve ${t.eve ? 'On' : 'Off'}`}
              />
              <span className={`font-mono text-[10px] font-bold ${t.eve ? 'text-eve-400' : 'text-signal-400'}`}>
                {t.eve ? 'E' : '✓'}
              </span>
            </div>
          ))}
        </div>
      )}

      {trials.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-5 border-t border-abyss-700/40 pt-3 font-mono text-[11px] text-ink-400">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-signal-400" />
            Eve Off (QBER ≈ 0%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-eve-500" />
            Eve 100% Intercept (QBER ≈ 25%)
          </span>
        </div>
      )}
    </div>
  )
}
