import {
  Play,
  Shield,
  ShieldAlert,
  SlidersHorizontal,
  TriangleAlert,
  RotateCcw,
  Loader2,
} from 'lucide-react'
import { useState } from 'react'
import type { SimulateRequest } from '../types'

export const DEFAULT_CONFIG: SimulateRequest = {
  n_photons: 256,
  eve_enabled: false,
  interception_rate: 1.0,
  noise_rate: 0.0,
  sample_fraction: 0.25,
  threshold: 0.11,
  message: null,
  seed: null,
}

/** Local validation mirroring the backend constraints (fast feedback). */
export function validateConfig(c: SimulateRequest): string[] {
  const errors: string[] = []
  if (!Number.isInteger(c.n_photons) || c.n_photons < 8 || c.n_photons > 4096)
    errors.push('Photon count must be an integer between 8 and 4096.')
  if (c.interception_rate < 0 || c.interception_rate > 1)
    errors.push('Interception probability must be between 0 and 1.')
  if (c.noise_rate < 0 || c.noise_rate > 1)
    errors.push('Channel noise must be between 0 and 1.')
  if (c.sample_fraction < 0 || c.sample_fraction > 1)
    errors.push('Test sample fraction must be between 0 and 1.')
  if (c.threshold <= 0 || c.threshold > 1)
    errors.push('Abort threshold must be greater than 0 and at most 1.')
  if (c.seed !== null && (!Number.isInteger(c.seed) || c.seed < 0 || c.seed > 2 ** 32 - 1))
    errors.push('Seed must be a non-negative integer below 2^32.')
  if (c.message && c.message.length > 512)
    errors.push('Message must be at most 512 characters.')
  return errors
}

function SliderField({
  label,
  hint,
  value,
  min,
  max,
  step,
  onChange,
  suffix,
  icon,
  variant = 'default',
}: {
  label: string
  hint: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  suffix?: string
  icon?: React.ReactNode
  variant?: 'default' | 'threshold' | 'danger' | 'noise'
}) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))

  // Dynamic gradient tracks based on variant & value
  let trackGradient = `linear-gradient(to right, rgba(6,182,212,0.5) 0%, rgba(6,182,212,0.3) ${pct}%, rgba(28,42,69,0.8) ${pct}%, rgba(38,56,88,0.6) 100%)`
  let badgeClasses = 'bg-signal-500/10 border-signal-500/25 text-signal-300'

  if (variant === 'threshold') {
    if (value <= 0.11) {
      trackGradient = `linear-gradient(to right, rgba(74,222,128,0.5) 0%, rgba(6,182,212,0.4) ${pct}%, rgba(28,42,69,0.8) ${pct}%, rgba(38,56,88,0.6) 100%)`
      badgeClasses = 'bg-pass-400/15 border-pass-400/30 text-pass-400 shadow-[0_0_10px_rgba(74,222,128,0.15)]'
    } else if (value <= 0.16) {
      trackGradient = `linear-gradient(to right, rgba(251,191,36,0.5) 0%, rgba(245,158,11,0.4) ${pct}%, rgba(28,42,69,0.8) ${pct}%, rgba(38,56,88,0.6) 100%)`
      badgeClasses = 'bg-warn-400/15 border-warn-400/30 text-warn-400 shadow-[0_0_10px_rgba(251,191,36,0.15)]'
    } else {
      trackGradient = `linear-gradient(to right, rgba(239,68,68,0.6) 0%, rgba(244,63,94,0.4) ${pct}%, rgba(28,42,69,0.8) ${pct}%, rgba(38,56,88,0.6) 100%)`
      badgeClasses = 'bg-eve-400/15 border-eve-400/30 text-eve-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
    }
  } else if (variant === 'danger') {
    trackGradient = `linear-gradient(to right, rgba(239,68,68,0.6) 0%, rgba(244,63,94,0.3) ${pct}%, rgba(28,42,69,0.8) ${pct}%, rgba(38,56,88,0.6) 100%)`
    badgeClasses = 'bg-eve-500/15 border-eve-500/30 text-eve-400 shadow-[0_0_10px_rgba(239,68,68,0.15)]'
  } else if (variant === 'noise') {
    trackGradient = `linear-gradient(to right, rgba(167,139,250,0.5) 0%, rgba(139,92,246,0.3) ${pct}%, rgba(28,42,69,0.8) ${pct}%, rgba(38,56,88,0.6) 100%)`
    badgeClasses = 'bg-bob-500/15 border-bob-500/30 text-bob-300'
  }

  return (
    <label className="block group">
      <span className="flex items-center justify-between mb-2.5">
        <span className="flex items-center gap-2 text-[12.5px] sm:text-[13px] font-semibold text-ink-200">
          {icon}
          {label}
        </span>
        <span className={`tnum font-mono text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded border transition-colors ${badgeClasses}`}>
          {value}
          {suffix}
        </span>
      </span>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full cursor-pointer transition-all"
          style={{ background: trackGradient }}
          aria-label={label}
        />
      </div>
      <span className="mt-1.5 block text-[10.5px] sm:text-[11px] leading-[1.6] text-ink-500">{hint}</span>
    </label>
  )
}

export function ControlPanel({
  config,
  onChange,
  onRun,
  running,
  disabled,
}: {
  config: SimulateRequest
  onChange: (c: SimulateRequest) => void
  onRun: () => void
  running: boolean
  disabled: boolean
}) {
  const [showSeed, setShowSeed] = useState(false)
  const set = <K extends keyof SimulateRequest>(key: K, value: SimulateRequest[K]) =>
    onChange({ ...config, [key]: value })
  const errors = validateConfig(config)

  return (
    <section
      aria-label="Experiment controls"
      className="glass-card rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-abyss-700/60 bg-gradient-to-r from-signal-500/[0.04] to-transparent">
        <h2 className="flex items-center gap-2 text-[14px] sm:text-[14.5px] font-bold tracking-tight text-ink-100">
          <SlidersHorizontal className="size-3.5 text-signal-400" aria-hidden />
          Experiment Parameters
        </h2>
        <button
          type="button"
          onClick={() => onChange(DEFAULT_CONFIG)}
          className="inline-flex items-center gap-1.5 font-mono text-[10.5px] text-ink-500 transition-all hover:text-signal-300"
        >
          <RotateCcw className="size-3" aria-hidden />
          RESET
        </button>
      </div>

      {/* Sliders */}
      <div className="px-4 sm:px-6 py-4 space-y-4">
        <SliderField
          label="Photon Count"
          hint="Total light pulses sent (8–4096)."
          value={config.n_photons}
          min={8}
          max={4096}
          step={8}
          onChange={(v) => set('n_photons', v)}
          suffix=" QUBITS"
        />
        <SliderField
          label="Test Sample Fraction"
          hint="Portion of matching bits revealed to test for Eve."
          value={config.sample_fraction}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => set('sample_fraction', v)}
          suffix="×"
        />
        <SliderField
          label="Abort Threshold (QBER)"
          hint="Max error before aborting (~11% Shor–Preskill)."
          value={config.threshold}
          min={0.01}
          max={1}
          step={0.01}
          onChange={(v) => set('threshold', v)}
          suffix=" QBER"
          variant="threshold"
        />
        <SliderField
          label="Channel Noise"
          hint="Depolarizing noise in optical fiber."
          value={config.noise_rate}
          min={0}
          max={0.5}
          step={0.005}
          onChange={(v) => set('noise_rate', v)}
          suffix=" / qubit"
          variant="noise"
        />
      </div>

      {/* Eve controls */}
      <div className="mx-4 sm:mx-6 mb-4 rounded-xl border border-abyss-700/60 bg-abyss-850/50 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 sm:px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={`grid size-8 place-items-center rounded-lg transition-all duration-300 ${
              config.eve_enabled
                ? 'bg-eve-500/15 border border-eve-500/30'
                : 'bg-abyss-700/50 border border-abyss-600'
            }`}>
              {config.eve_enabled ? (
                <ShieldAlert className="size-4 text-eve-400" aria-hidden />
              ) : (
                <Shield className="size-4 text-ink-400" aria-hidden />
              )}
            </div>
            <div>
              <div className="text-[13px] font-semibold text-ink-200">
                Eavesdropper (Eve)
              </div>
              <div className="text-[11px] text-ink-500">
                Intercept–resend attack
              </div>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={config.eve_enabled}
            onClick={() => set('eve_enabled', !config.eve_enabled)}
            className={`relative h-7 w-12 shrink-0 rounded-full border-2 transition-all duration-300 ${
              config.eve_enabled
                ? 'border-eve-500/50 bg-eve-500/25 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                : 'border-abyss-600 bg-abyss-800'
            }`}
          >
            <span
              className={`absolute top-0.5 size-5 rounded-full transition-all duration-300 shadow-md ${
                config.eve_enabled ? 'left-[22px] bg-eve-400' : 'left-0.5 bg-ink-500'
              }`}
            />
            <span className="sr-only">
              {config.eve_enabled ? 'Eve enabled' : 'Eve disabled'}
            </span>
          </button>
        </div>
        {config.eve_enabled && (
          <div className="px-3.5 sm:px-4 pb-3.5 pt-1 border-t border-abyss-700/40">
            <SliderField
              label="Interception Rate"
              hint="Probability Eve taps and resends each qubit."
              value={config.interception_rate}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => set('interception_rate', v)}
              suffix=" / qubit"
              variant="danger"
            />
          </div>
        )}
      </div>

      {/* Advanced: seed + message */}
      <details className="mx-4 sm:mx-6 mb-4 group" open={showSeed} onToggle={(e) => setShowSeed((e.target as HTMLDetailsElement).open)}>
        <summary className="cursor-pointer list-none font-mono text-[11px] tracking-[0.16em] text-ink-500 uppercase transition-all hover:text-signal-300 flex items-center gap-2">
          <span className="transition-transform group-open:rotate-90 inline-block">▸</span>
          Message &amp; reproducibility
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-[12.5px] font-semibold text-ink-200">
              Plaintext message
            </span>
            <input
              type="text"
              value={config.message ?? ''}
              maxLength={512}
              placeholder="e.g. SECRET CODE"
              onChange={(e) => set('message', e.target.value === '' ? null : e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-abyss-600 bg-abyss-900/80 px-3 py-1.5 font-mono text-xs text-ink-100 placeholder-ink-500 transition-all focus:border-signal-500/60 focus:outline-none"
              aria-label="Plaintext message for the one-time-pad demonstration"
            />
            <span className="mt-1 block text-[10.5px] text-ink-500">
              Encrypted via One-Time Pad XOR.
            </span>
          </label>
          <label className="block">
            <span className="text-[12.5px] font-semibold text-ink-200">
              Deterministic seed
            </span>
            <input
              type="number"
              min={0}
              value={config.seed ?? ''}
              placeholder="e.g. 42"
              onChange={(e) =>
                set('seed', e.target.value === '' ? null : Math.max(0, Math.floor(Number(e.target.value))))
              }
              className="mt-1.5 w-full rounded-lg border border-abyss-600 bg-abyss-900/80 px-3 py-1.5 font-mono text-xs text-ink-100 placeholder-ink-500 transition-all focus:border-signal-500/60 focus:outline-none"
              aria-label="Optional deterministic seed"
            />
            <span className="mt-1 block text-[10.5px] text-ink-500">
              Fixes pseudo-randomness for testing.
            </span>
          </label>
        </div>
      </details>

      {errors.length > 0 && (
        <ul className="mx-4 sm:mx-6 mb-4 sm:mb-5 space-y-2" role="alert">
          {errors.map((e) => (
            <li key={e} className="flex items-start gap-2.5 text-[12px] text-warn-400">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {e}
            </li>
          ))}
        </ul>
      )}

      {/* Run button */}
      <div className="px-4 sm:px-6 pb-5 sm:pb-6">
        <button
          type="button"
          onClick={onRun}
          disabled={running || errors.length > 0 || disabled}
          className={`group relative flex w-full items-center justify-between rounded-xl border px-4.5 py-3 font-mono text-[12px] font-bold tracking-[0.14em] uppercase transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 overflow-hidden ${
            running
              ? 'border-signal-500/30 bg-signal-500/10 text-signal-400'
              : 'border-abyss-700/80 bg-gradient-to-b from-abyss-800/80 via-abyss-850/90 to-abyss-900/90 text-ink-200 hover:border-signal-500/40 hover:bg-abyss-800 hover:text-ink-100 hover:shadow-[0_2px_12px_rgba(0,0,0,0.4)] active:translate-y-[1px]'
          }`}
        >
          {/* Subtle top edge specular highlight */}
          <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-signal-400/25 to-transparent" />

          {running ? (
            <span className="flex items-center gap-2.5 mx-auto py-0.5">
              <Loader2 className="size-4 animate-spin text-signal-400" aria-hidden />
              <span>Transmitting Qubits…</span>
            </span>
          ) : (
            <>
              <span className="flex items-center gap-2.5">
                <span className="grid size-6 place-items-center rounded-md bg-signal-500/10 border border-signal-500/25 text-signal-400 group-hover:border-signal-500/40 group-hover:bg-signal-500/15 group-hover:text-signal-300 transition-colors">
                  <Play className="size-3 fill-current" aria-hidden />
                </span>
                <span>Run Experiment</span>
              </span>

              <span className="rounded bg-black/30 px-2 py-0.5 text-[10px] tracking-wider text-ink-400 border border-abyss-700/60 group-hover:border-abyss-600 group-hover:text-ink-300 transition-colors">
                EXECUTE
              </span>
            </>
          )}
        </button>
      </div>
    </section>
  )
}
