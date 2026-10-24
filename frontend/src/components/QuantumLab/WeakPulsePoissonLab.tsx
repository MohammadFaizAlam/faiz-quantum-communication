import { useState, useMemo } from 'react'
import {
  Radio,
  ShieldAlert,
  ShieldCheck,
  Info,
  ChevronDown,
  ChevronUp,
  Lock,
} from 'lucide-react'
import {
  calculatePoissonStatistics,
  type PoissonResult,
} from './quantumPhysics'

const PRESETS = [
  { label: 'Standard Safe (μ = 0.10)', mu: 0.1, desc: 'Recommended: very low eavesdropping risk' },
  { label: 'Decoy State (μ = 0.50)', mu: 0.5, desc: 'Modern telecom: higher speed with decoy protection' },
  { label: 'Too Bright (μ = 1.00)', mu: 1.0, desc: 'Dangerous: 26% of pulses leak extra photons!' },
]

export function WeakPulsePoissonLab() {
  const [mu, setMu] = useState<number>(0.1)
  const [showTheory, setShowTheory] = useState<boolean>(false)
  const [showMath, setShowMath] = useState<boolean>(false)

  const stats: PoissonResult = useMemo(() => calculatePoissonStatistics(mu), [mu])

  const p0Pct = (stats.p0 * 100).toFixed(1)
  const p1Pct = (stats.p1 * 100).toFixed(1)
  const pMultiPct = (stats.pMulti * 100).toFixed(1)

  const isSafe = stats.pMulti <= 0.02
  const isWarning = stats.pMulti > 0.02 && stats.pMulti <= 0.08

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-abyss-700/60 shadow-xl">
      {/* Title Bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-abyss-700/50 bg-gradient-to-r from-amber-500/[0.06] to-transparent">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-amber-500/15 border border-amber-500/30">
            <Radio className="size-4.5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-ink-100">
              Station 3: Laser Pulses &amp; Multi-Photon Security
            </h2>
            <p className="text-xs text-ink-400">
              Why real lasers emit random photon bursts — and how eavesdroppers exploit them
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowTheory(!showTheory)}
          className="text-xs font-mono text-ink-400 hover:text-amber-300 transition-colors flex items-center justify-center gap-1.5 p-2 sm:px-2.5 sm:py-1 rounded-lg border border-abyss-700 hover:border-amber-500/30 shrink-0"
          title={showTheory ? 'Hide Concept' : 'How It Works'}
          aria-label={showTheory ? 'Hide Concept' : 'How It Works'}
        >
          <Info className="size-3.5" />
          <span className="hidden sm:inline">{showTheory ? 'Hide Concept' : 'How It Works'}</span>
        </button>
      </div>

      {/* Explainer Box */}
      {showTheory && (
        <div className="px-5 py-3.5 bg-abyss-900/60 border-b border-abyss-700/40 text-xs text-ink-300 leading-relaxed space-y-1.5">
          <p>
            Real single-photon emitters are hard to build. Instead, commercial QKD systems take a standard semiconductor laser and dim it down into extremely weak pulses.
          </p>
          <p>
            Because laser emission follows Poisson randomness, a pulse sometimes contains <strong>0 photons (vacuum)</strong>, sometimes <strong>1 photon (secure)</strong>, and sometimes <strong>2+ photons (vulnerable)</strong>!
          </p>
        </div>
      )}

      {/* 2-Column Workbench */}
      <div className="grid lg:grid-cols-[380px_1fr] divide-y lg:divide-y-0 lg:divide-x divide-abyss-700/50">
        {/* Left Column: Interactive Intensity Slider */}
        <div className="p-6 space-y-5">
          {/* Quick Presets */}
          <div>
            <span className="font-mono text-[11px] font-semibold text-ink-400 uppercase tracking-wider block mb-2.5">
              Select Laser Intensity Preset:
            </span>
            <div className="space-y-2">
              {PRESETS.map(p => {
                const active = Math.abs(mu - p.mu) < 0.01
                return (
                  <button
                    key={p.mu}
                    onClick={() => setMu(p.mu)}
                    className={`w-full text-left rounded-xl p-3 border transition-all flex items-center justify-between ${
                      active
                        ? 'border-amber-500/80 bg-amber-500/15 text-white shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                        : 'border-abyss-700 bg-abyss-850/60 text-ink-300 hover:border-abyss-600'
                    }`}
                  >
                    <div>
                      <div className="font-mono text-xs font-bold text-amber-300">{p.label}</div>
                      <div className="text-[10.5px] text-ink-400 mt-0.5">{p.desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Slider */}
          <div className="rounded-xl border border-abyss-700/60 bg-black/25 p-4 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-ink-300">Laser Brightness (μ)</span>
              <span className="text-amber-400 font-bold text-sm">{mu.toFixed(2)} photons/pulse</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1.50"
              step="0.05"
              value={mu}
              onChange={e => setMu(+e.target.value)}
              className="w-full accent-amber-400"
            />
            <div className="flex justify-between text-[10px] font-mono text-ink-500">
              <span>0.05 (Dim &amp; Safe)</span>
              <span>0.50 (Decoy)</span>
              <span>1.50 (Too Bright!)</span>
            </div>
          </div>

          {/* Security Status Box */}
          <div className={`rounded-xl border p-3.5 flex items-start gap-3 ${
            isSafe
              ? 'border-pass-500/30 bg-pass-500/[0.08] text-pass-300'
              : isWarning
              ? 'border-amber-500/30 bg-amber-500/[0.08] text-amber-300'
              : 'border-eve-500/40 bg-eve-500/[0.1] text-eve-300'
          }`}>
            {isSafe ? (
              <ShieldCheck className="size-5 shrink-0 text-pass-400" />
            ) : (
              <ShieldAlert className="size-5 shrink-0 text-amber-400" />
            )}
            <div className="text-xs leading-relaxed">
              {isSafe ? (
                <>
                  <strong className="text-pass-300 block font-bold mb-0.5">Secure Operation</strong>
                  Only {pMultiPct}% multi-photons. The risk of Eve stealing key bits without detection is safely bounded.
                </>
              ) : isWarning ? (
                <>
                  <strong className="text-amber-300 block font-bold mb-0.5">Moderate Risk</strong>
                  Multi-photon emission reached {pMultiPct}%. Standard BB84 must discard extra bits during privacy amplification.
                </>
              ) : (
                <>
                  <strong className="text-eve-300 block font-bold mb-0.5">Severe Eavesdropping Vulnerability</strong>
                  {pMultiPct}% of pulses contain 2+ photons! Eve can perform Photon Number Splitting (PNS) to crack the key.
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Visual Breakdown & PNS Explainer */}
        <div className="p-6 space-y-5 flex flex-col justify-between">
          {/* Visual 3-Way Category Cards */}
          <div className="space-y-3">
            <span className="font-mono text-xs text-ink-400 uppercase tracking-wider block">
              What Each Laser Pulse Contains:
            </span>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Single Photon */}
              <div className="rounded-xl border border-signal-500/40 bg-signal-500/10 p-3 text-center">
                <span className="font-mono text-[10px] text-signal-400 uppercase tracking-wider block">
                  Single Photon
                </span>
                <span className="font-mono text-lg font-bold text-signal-200 mt-1 block">
                  {p1Pct}%
                </span>
                <span className="text-[10px] text-signal-400/80 block mt-0.5">
                  ✓ Genuinely Secure
                </span>
              </div>

              {/* Multi-Photon */}
              <div className={`rounded-xl border p-3 text-center ${
                stats.pMulti > 0.05
                  ? 'border-eve-500/50 bg-eve-500/15 text-eve-300'
                  : 'border-abyss-700 bg-black/25 text-ink-400'
              }`}>
                <span className="font-mono text-[10px] uppercase tracking-wider block text-eve-400">
                  Multi-Photon
                </span>
                <span className="font-mono text-lg font-bold text-eve-300 mt-1 block">
                  {pMultiPct}%
                </span>
                <span className="text-[10px] text-eve-400/80 block mt-0.5">
                  ⚠ Eve can split off 1
                </span>
              </div>

              {/* Vacuum */}
              <div className="rounded-xl border border-abyss-700 bg-black/25 p-3 text-center">
                <span className="font-mono text-[10px] text-ink-500 uppercase tracking-wider block">
                  Vacuum (Empty)
                </span>
                <span className="font-mono text-lg font-bold text-ink-300 mt-1 block">
                  {p0Pct}%
                </span>
                <span className="text-[10px] text-ink-500 block mt-0.5">
                  No light emitted
                </span>
              </div>
            </div>

            {/* Proportion Bar */}
            <div className="pt-2">
              <div className="h-3 rounded-full bg-abyss-800 overflow-hidden flex shadow-inner">
                <div
                  className="h-full bg-signal-500 transition-all duration-300"
                  style={{ width: `${stats.p1 * 100}%` }}
                  title={`Single: ${p1Pct}%`}
                />
                <div
                  className="h-full bg-eve-500 transition-all duration-300"
                  style={{ width: `${stats.pMulti * 100}%` }}
                  title={`Multi: ${pMultiPct}%`}
                />
                <div
                  className="h-full bg-abyss-700 transition-all duration-300"
                  style={{ width: `${stats.p0 * 100}%` }}
                  title={`Empty: ${p0Pct}%`}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-ink-500 mt-1">
                <span className="text-signal-400">■ Single Photons</span>
                <span className="text-eve-400">■ Multi-Photons</span>
                <span className="text-ink-500">■ Empty Pulses</span>
              </div>
            </div>
          </div>

          {/* Simple PNS Attack Explainer */}
          <div className="rounded-xl border border-abyss-700/60 bg-abyss-900/40 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-amber-400" />
              <span className="font-mono text-xs font-bold text-ink-200 uppercase tracking-wider">
                How Eve Exploits Multi-Photon Pulses (The PNS Attack)
              </span>
            </div>
            <p className="text-xs text-ink-300 leading-relaxed">
              When a pulse has 2 photons with the same polarization, Eve uses an optical beam splitter to peel off 1 photon into quantum storage and forwards the other photon to Bob. Bob detects zero disturbance! Later, when Alice and Bob publicly reveal their bases, Eve measures her saved photon and gains the key bit with <strong>100% secrecy</strong>.
            </p>
          </div>

          {/* Collapsible Math */}
          <div>
            <button
              onClick={() => setShowMath(!showMath)}
              className="w-full flex items-center justify-between text-xs font-mono text-ink-400 hover:text-ink-200 py-1 transition-colors"
            >
              <span>{showMath ? '▼ Hide Poisson Equation' : '▶ View Poisson Equation'}</span>
              {showMath ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>
            {showMath && (
              <div className="mt-2 p-3 rounded-lg border border-abyss-800 bg-black/40 text-[11px] font-mono text-ink-400 space-y-1">
                <div>Poisson Distribution: P(n) = (e^−μ · μⁿ) / n!</div>
                <div>P(0) = e^−μ &nbsp;|&nbsp; P(1) = μ · e^−μ &nbsp;|&nbsp; P(n ≥ 2) = 1 − e^−μ(1 + μ)</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
