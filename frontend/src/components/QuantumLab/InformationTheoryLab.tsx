import { useState, useMemo } from 'react'
import {
  Lock,
  ShieldCheck,
  ShieldAlert,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  binaryEntropy,
  shorPreskillKeyRate,
  generateKeyRateCurve,
} from './quantumPhysics'

export function InformationTheoryLab() {
  const [qberPercent, setQberPercent] = useState<number>(4.0)
  const [showTheory, setShowTheory] = useState<boolean>(false)
  const [showMath, setShowMath] = useState<boolean>(false)

  const qber = qberPercent / 100
  const h_q = binaryEntropy(qber)
  const keyRate = shorPreskillKeyRate(qber)

  // Assuming 1000 raw bits
  const rawBits = 1000
  const leakedBits = Math.ceil(rawBits * h_q)
  const purgedBits = Math.ceil(rawBits * h_q)
  const secretBits = Math.max(0, Math.floor(rawBits * keyRate))

  const isSecure = qber < 0.110028

  // Curve data
  const curveData = useMemo(() => generateKeyRateCurve(100), [])

  const svgW = 480, svgH = 170, padL = 40, padR = 20, padT = 15, padB = 30
  const plotW = svgW - padL - padR, plotH = svgH - padT - padB

  const toX = (q: number) => padL + (q / 0.20) * plotW
  const toY = (r: number) => padT + (1 - r) * plotH

  const rPath = curveData
    .filter(d => d.qber <= 0.20)
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(d.qber).toFixed(1)},${toY(d.keyRate).toFixed(1)}`)
    .join(' ')

  const thresholdX = toX(0.110028)

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-abyss-700/60 shadow-xl">
      {/* Title Bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-abyss-700/50 bg-gradient-to-r from-signal-500/[0.06] to-transparent">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-signal-500/15 border border-signal-500/30">
            <Lock className="size-4.5 text-signal-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-ink-100">
              Station 5: Secret Key Distillation &amp; The 11% Limit
            </h2>
            <p className="text-xs text-ink-400">
              How Alice and Bob extract a 100% secret key — and why 11% error is the hard cutoff
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowTheory(!showTheory)}
          className="text-xs font-mono text-ink-400 hover:text-signal-300 transition-colors flex items-center justify-center gap-1.5 p-2 sm:px-2.5 sm:py-1 rounded-lg border border-abyss-700 hover:border-signal-500/30 shrink-0"
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
            When Alice and Bob compare a small sample of their bits, they measure the <strong>Quantum Bit Error Rate (QBER)</strong>.
          </p>
          <p>
            Using classical algorithms (Error Correction and Privacy Amplification), they sacrifice some bits to fix mistakes and completely wipe out any partial information an eavesdropper might have gained.
          </p>
        </div>
      )}

      {/* 2-Column Workbench */}
      <div className="grid lg:grid-cols-[380px_1fr] divide-y lg:divide-y-0 lg:divide-x divide-abyss-700/50">
        {/* Left Column: Interactive QBER Slider */}
        <div className="p-6 space-y-5">
          {/* Main Error Slider */}
          <div className="rounded-xl border border-abyss-700/60 bg-black/25 p-4 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-ink-300 font-semibold">Observed Error Rate (QBER)</span>
              <span className={`font-bold text-base ${isSecure ? 'text-pass-400' : 'text-eve-400'}`}>
                {qberPercent.toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="18.0"
              step="0.5"
              value={qberPercent}
              onChange={e => setQberPercent(+e.target.value)}
              className="w-full accent-signal-400"
            />
            <div className="flex justify-between text-[10px] font-mono text-ink-500">
              <span>0% (Perfect)</span>
              <span>4% (Typical Lab)</span>
              <span className="text-eve-400 font-bold">11% (Cutoff)</span>
              <span>18% (Breached)</span>
            </div>
          </div>

          {/* Status Box */}
          <div className={`rounded-xl border p-3.5 flex items-start gap-3 ${
            isSecure
              ? 'border-pass-500/30 bg-pass-500/[0.08] text-pass-300'
              : 'border-eve-500/40 bg-eve-500/[0.1] text-eve-300'
          }`}>
            {isSecure ? (
              <ShieldCheck className="size-5 shrink-0 text-pass-400" />
            ) : (
              <ShieldAlert className="size-5 shrink-0 text-eve-400" />
            )}
            <div className="text-xs leading-relaxed">
              {isSecure ? (
                <>
                  <strong className="text-pass-300 font-bold block mb-0.5">Secure Key Can Be Distilled</strong>
                  With {qberPercent.toFixed(1)}% error, Alice &amp; Bob can extract an unconditionally secret key ({((keyRate * 100)).toFixed(0)}% yield).
                </>
              ) : (
                <>
                  <strong className="text-eve-300 font-bold block mb-0.5">Protocol Aborted: Eavesdropper Detected!</strong>
                  Error rate exceeds the 11.0% limit. Eve has gained too much mutual information; generating a secret key is mathematically impossible.
                </>
              )}
            </div>
          </div>

          {/* Distillation Yield Metric */}
          <div className="rounded-xl border border-abyss-700/60 bg-black/20 p-4 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-ink-400">Key Yield per Sifted Bit:</span>
              <span className={`font-bold text-base ${isSecure ? 'text-signal-300' : 'text-eve-400'}`}>
                {isSecure ? `${(keyRate * 100).toFixed(1)}%` : '0%'}
              </span>
            </div>
            <div className="h-2 rounded-full bg-abyss-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${isSecure ? 'bg-signal-400' : 'bg-eve-500'}`}
                style={{ width: `${Math.max(0, keyRate * 100)}%` }}
              />
            </div>
          </div>

          {/* Collapsible Math Accordion */}
          <div>
            <button
              onClick={() => setShowMath(!showMath)}
              className="w-full flex items-center justify-between text-xs font-mono text-ink-400 hover:text-ink-200 py-1 transition-colors"
            >
              <span>{showMath ? '▼ Hide Shor-Preskill Proof' : '▶ View Shor-Preskill Equation'}</span>
              {showMath ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>
            {showMath && (
              <div className="mt-2 p-3 rounded-lg border border-abyss-800 bg-black/40 text-[11px] font-mono text-ink-400 space-y-1">
                <div>Key Rate Formula: r = 1 − 2 · h₂(QBER)</div>
                <div>Where h₂(e) = −e · log₂(e) − (1 − e) · log₂(1 − e)</div>
                <div>r = 0 ⟹ h₂(e) = 0.5 ⟹ e ≈ 11.0028% (Critical Threshold)</div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Visual 3-Stage Pipeline & Curve */}
        <div className="p-6 space-y-5 flex flex-col justify-between">
          {/* Visual 3-Stage Pipeline */}
          <div className="space-y-3">
            <span className="font-mono text-xs text-ink-400 uppercase tracking-wider block">
              3-Stage Key Distillation (Example 1,000 Bits):
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Step 1: Raw Sifted Bits */}
              <div className="rounded-xl border border-abyss-700 bg-black/30 p-3 text-center">
                <span className="font-mono text-[10px] text-ink-500 uppercase tracking-wider block">
                  1. Sifted Bits
                </span>
                <span className="font-mono text-lg font-bold text-ink-100 mt-1 block">
                  {rawBits}
                </span>
                <span className="text-[10px] text-ink-500 block mt-0.5">Matching bases</span>
              </div>

              {/* Step 2: Bits Sacrificed */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3 text-center">
                <span className="font-mono text-[10px] text-amber-400 uppercase tracking-wider block">
                  2. Bits Sacrificed
                </span>
                <span className="font-mono text-lg font-bold text-amber-300 mt-1 block">
                  −{isSecure ? (leakedBits + purgedBits) : 1000}
                </span>
                <span className="text-[10px] text-amber-400/80 block mt-0.5">
                  Fix error &amp; purge Eve
                </span>
              </div>

              {/* Step 3: Clean Secret Key */}
              <div className={`rounded-xl border p-3 text-center transition-all ${
                isSecure
                  ? 'border-pass-500/50 bg-pass-500/10 shadow-[0_0_15px_rgba(74,222,128,0.15)] text-pass-300'
                  : 'border-eve-500/40 bg-eve-500/10 text-eve-400'
              }`}>
                <span className="font-mono text-[10px] uppercase tracking-wider block">
                  3. Distilled Key
                </span>
                <span className="font-mono text-xl font-bold mt-1 block">
                  {secretBits} bits
                </span>
                <span className="text-[10px] block mt-0.5">
                  {isSecure ? '✓ 100% Secure Key' : '✖ Aborted'}
                </span>
              </div>
            </div>
          </div>

          {/* SVG Key Rate vs Error Curve */}
          <div className="rounded-xl border border-abyss-700/60 bg-black/30 p-3">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-ink-400">Secret Key Fraction vs. Error Rate:</span>
              <span className="text-eve-400 font-bold">11.0% Threshold</span>
            </div>

            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full">
              {/* Vertical red cutoff line at 11% */}
              <line
                x1={thresholdX}
                y1={padT}
                x2={thresholdX}
                y2={svgH - padB}
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              <text x={thresholdX + 4} y={padT + 10} className="fill-eve-400 text-[8.5px] font-mono">
                11.0% Cutoff
              </text>

              {/* X-axis labels */}
              {[0, 0.05, 0.10, 0.15, 0.20].map(q => (
                <text key={q} x={toX(q)} y={svgH - 8} textAnchor="middle" className="fill-ink-500 text-[8px] font-mono">
                  {(q * 100).toFixed(0)}%
                </text>
              ))}

              {/* Curve */}
              <path d={rPath} fill="none" stroke="#22d3ee" strokeWidth="2.5" />

              {/* Operating needle */}
              <line
                x1={toX(Math.min(0.20, qber))}
                y1={padT}
                x2={toX(Math.min(0.20, qber))}
                y2={svgH - padB}
                stroke={isSecure ? '#4ade80' : '#ef4444'}
                strokeWidth="1.5"
              />
              <circle
                cx={toX(Math.min(0.20, qber))}
                cy={toY(keyRate)}
                r="4.5"
                fill={isSecure ? '#4ade80' : '#ef4444'}
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
