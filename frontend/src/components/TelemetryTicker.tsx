import { Terminal } from 'lucide-react'
import type { SimulateRequest, SimulateResult } from '../types'
import { AnimatedNumber } from './ui'

export function TelemetryTicker({
  result,
  config,
  running,
}: {
  result: SimulateResult | null
  config: SimulateRequest
  running: boolean
}) {
  const isPass = result?.decision.status === 'PASS'
  const isAbort = result?.decision.status === 'ABORT'

  return (
    <aside
      aria-label="Quantum Telemetry Ticker"
      className="relative overflow-hidden rounded-xl border border-abyss-700/70 bg-gradient-to-r from-abyss-950 via-abyss-900 to-abyss-950 px-3.5 py-2.5 shadow-[0_2px_18px_rgba(0,0,0,0.5)] mb-6 sm:mb-8"
    >
      {/* Top subtle highlight line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-signal-400/30 to-transparent" />

      <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4 font-mono text-[11px] sm:text-[11.5px]">
        {/* Left: System Status Flag */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 rounded-md px-2 py-0.5 bg-black/40 border border-abyss-700/80">
            <span
              className={`size-2 rounded-full ${
                running
                  ? 'bg-signal-400 animate-ping'
                  : isAbort
                    ? 'bg-eve-400 shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-pulse'
                    : isPass
                      ? 'bg-pass-400 shadow-[0_0_8px_rgba(16,185,129,0.9)]'
                      : 'bg-signal-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]'
              }`}
            />
            <span className="font-bold tracking-wider text-ink-200">
              {running
                ? 'TX_TRANSMITTING'
                : isAbort
                  ? 'INTRUSION_DETECTED'
                  : isPass
                    ? 'QUANTUM_SECURED'
                    : 'LAB_READY'}
            </span>
          </div>

          <span className="text-ink-500 hidden sm:inline">│</span>
          <span className="text-ink-400 hidden sm:flex items-center gap-1 text-[10.5px]">
            <Terminal className="size-3 text-amber-400" aria-hidden />
            <span className="text-amber-400/90 font-semibold">BB84.QKD</span>
          </span>
        </div>

        {/* Center: Monospace Data Stream */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-ink-400">
          <div className="flex items-center gap-1.5">
            <span className="text-ink-500 uppercase tracking-widest text-[9.5px]">TX:</span>
            <span className="tnum font-bold text-ink-100">{config.n_photons}</span>
            <span className="text-ink-500 text-[10px]">qubits</span>
          </div>

          <span className="text-abyss-700 hidden md:inline">/</span>

          <div className="flex items-center gap-1.5">
            <span className="text-ink-500 uppercase tracking-widest text-[9.5px]">EVE:</span>
            <span
              className={`tnum font-bold ${
                config.eve_enabled ? 'text-eve-400' : 'text-ink-400'
              }`}
            >
              {config.eve_enabled ? `${Math.round(config.interception_rate * 100)}% TAP` : 'DISABLED'}
            </span>
          </div>

          <span className="text-abyss-700 hidden md:inline">/</span>

          <div className="flex items-center gap-1.5">
            <span className="text-ink-500 uppercase tracking-widest text-[9.5px]">NOISE:</span>
            <span className="tnum font-semibold text-ink-200">
              {config.noise_rate > 0 ? `${(config.noise_rate * 100).toFixed(1)}%` : '0.0%'}
            </span>
          </div>

          <span className="text-abyss-700 hidden md:inline">/</span>

          <div className="flex items-center gap-1.5">
            <span className="text-ink-500 uppercase tracking-widest text-[9.5px]">QBER:</span>
            <span
              className={`tnum font-bold ${
                result
                  ? isAbort
                    ? 'text-eve-400'
                    : 'text-pass-400'
                  : 'text-ink-400'
              }`}
            >
              {result?.decision.qber_observed != null ? (
                <AnimatedNumber
                  value={result.decision.qber_observed * 100}
                  decimals={1}
                  suffix="%"
                />
              ) : (
                '—'
              )}
            </span>
          </div>

          <span className="text-abyss-700 hidden lg:inline">/</span>

          <div className="hidden lg:flex items-center gap-1.5">
            <span className="text-ink-500 uppercase tracking-widest text-[9.5px]">KEY_CAP:</span>
            <span className="tnum font-semibold text-signal-300">
              {result?.information_theory?.shor_preskill_key_rate != null ? (
                <AnimatedNumber
                  value={result.information_theory.shor_preskill_key_rate * 100}
                  decimals={1}
                  suffix="%"
                />
              ) : (
                '—'
              )}
            </span>
          </div>

          <span className="text-abyss-700 hidden xl:inline">/</span>

          <div className="hidden xl:flex items-center gap-1.5">
            <span className="text-ink-500 uppercase tracking-widest text-[9.5px]">DISTILLED:</span>
            <span className="tnum font-bold text-amber-400">
              {result ? (
                <AnimatedNumber value={result.retained_key.length_bits} suffix=" bits" />
              ) : (
                '—'
              )}
            </span>
          </div>
        </div>

        {/* Right: Security Protocol badge */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <span className="rounded bg-signal-500/10 px-2 py-0.5 text-[10px] font-semibold text-signal-400 border border-signal-500/20">
            SHOR–PRESKILL 11%
          </span>
        </div>
      </div>
    </aside>
  )
}
