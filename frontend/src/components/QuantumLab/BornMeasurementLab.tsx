import { useState, useMemo, useCallback } from 'react'
import {
  Layers,
  Zap,
  RotateCcw,
  ShieldAlert,
  Info,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from 'lucide-react'
import {
  BB84_STATES,
  bornRuleMeasurement,
  type BB84StateName,
} from './quantumPhysics'

export function BornMeasurementLab() {
  const [selectedState, setSelectedState] = useState<BB84StateName>('H')
  const [measureBasis, setMeasureBasis] = useState<'+' | '×'>('+')
  const [showTheory, setShowTheory] = useState(false)
  const [showMath, setShowMath] = useState(false)

  // Single-shot state
  const [isFiring, setIsFiring] = useState(false)
  const [lastOutcome, setLastOutcome] = useState<{ bit: 0 | 1; stateName: string } | null>(null)

  // Multi-shot accumulator
  const [counts, setCounts] = useState<{ c0: number; c1: number; total: number }>({
    c0: 0,
    c1: 0,
    total: 0,
  })

  const stateObj = BB84_STATES[selectedState]
  const born = useMemo(
    () => bornRuleMeasurement(stateObj.theta, stateObj.phi, measureBasis),
    [stateObj, measureBasis],
  )

  const isBasisMatch = stateObj.basis === measureBasis

  // Single shot trigger
  const fireSinglePhoton = useCallback(() => {
    setIsFiring(true)
    setTimeout(() => {
      const outcome: 0 | 1 = Math.random() < born.probabilityZero ? 0 : 1
      const outcomeState =
        measureBasis === '+'
          ? outcome === 0 ? '|H⟩ (Horizontal)' : '|V⟩ (Vertical)'
          : outcome === 0 ? '|D⟩ (Diagonal)' : '|A⟩ (Anti-Diagonal)'

      setLastOutcome({ bit: outcome, stateName: outcomeState })
      setCounts(prev => ({
        c0: prev.c0 + (outcome === 0 ? 1 : 0),
        c1: prev.c1 + (outcome === 1 ? 1 : 0),
        total: prev.total + 1,
      }))
      setIsFiring(false)
    }, 150)
  }, [born.probabilityZero, measureBasis])

  // Batch trigger
  const fireBatch = useCallback((shots: number) => {
    let zeros = 0
    let ones = 0
    for (let i = 0; i < shots; i++) {
      if (Math.random() < born.probabilityZero) zeros++
      else ones++
    }
    const lastBit: 0 | 1 = Math.random() < born.probabilityZero ? 0 : 1
    const outcomeState =
      measureBasis === '+'
        ? lastBit === 0 ? '|H⟩ (Horizontal)' : '|V⟩ (Vertical)'
        : lastBit === 0 ? '|D⟩ (Diagonal)' : '|A⟩ (Anti-Diagonal)'

    setLastOutcome({ bit: lastBit, stateName: outcomeState })
    setCounts(prev => ({
      c0: prev.c0 + zeros,
      c1: prev.c1 + ones,
      total: prev.total + shots,
    }))
  }, [born.probabilityZero, measureBasis])

  const resetAll = () => {
    setCounts({ c0: 0, c1: 0, total: 0 })
    setLastOutcome(null)
  }

  const p0Percent = (born.probabilityZero * 100).toFixed(0)
  const p1Percent = (born.probabilityOne * 100).toFixed(0)

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-abyss-700/60 shadow-xl">
      {/* Title Bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-abyss-700/50 bg-gradient-to-r from-alice-500/[0.06] to-transparent">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-alice-500/15 border border-alice-500/30">
            <Layers className="size-4.5 text-alice-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-ink-100">
              Station 2: Quantum Measurement &amp; Wave-Function Collapse
            </h2>
            <p className="text-xs text-ink-400">
              Why observing a photon disturbs it — the core quantum defense of BB84
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowTheory(!showTheory)}
          className="text-xs font-mono text-ink-400 hover:text-alice-300 transition-colors flex items-center justify-center gap-1.5 p-2 sm:px-2.5 sm:py-1 rounded-lg border border-abyss-700 hover:border-alice-500/30 shrink-0"
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
            In quantum physics, measuring a particle is <strong>not passive</strong>. When you measure a photon in a basis different from how it was prepared, the photon is forced to randomly collapse onto one of the detector&apos;s two states.
          </p>
          <p className="text-amber-300">
            ✦ <strong>Same Basis (+ and +)</strong>: The detector reads the exact bit with 100% certainty.<br />
            ✦ <strong>Different Basis (+ and ×)</strong>: The detector gets a random 50/50 outcome and permanently destroys the original state!
          </p>
        </div>
      )}

      {/* Interactive 2-Column Workbench */}
      <div className="grid lg:grid-cols-[380px_1fr] divide-y lg:divide-y-0 lg:divide-x divide-abyss-700/50">
        {/* Left Column: Interactive Controls */}
        <div className="p-6 space-y-5">
          {/* Step 1: Alice Sends */}
          <div>
            <div className="text-[11px] font-mono font-semibold text-ink-400 uppercase tracking-wider mb-2">
              1. Alice Sends Photon State:
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(BB84_STATES) as [BB84StateName, typeof BB84_STATES['H']][]).map(([key, s]) => {
                const active = selectedState === key
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedState(key)}
                    className={`text-left rounded-xl p-2.5 border transition-all ${
                      active
                        ? 'border-alice-500 bg-alice-500/15 shadow-[0_0_15px_rgba(96,165,250,0.15)] text-white'
                        : 'border-abyss-700 bg-abyss-850/60 text-ink-300 hover:border-abyss-600'
                    }`}
                  >
                    <div className="font-mono text-xs font-bold text-alice-300">{s.label}</div>
                    <div className="text-[10px] text-ink-400 mt-0.5">
                      Bit {s.bit} · Basis {s.basis}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Step 2: Bob / Eve Measures In */}
          <div>
            <div className="text-[11px] font-mono font-semibold text-ink-400 uppercase tracking-wider mb-2">
              2. Detector Measurement Basis:
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMeasureBasis('+')}
                className={`rounded-xl p-2.5 text-center font-mono transition-all border ${
                  measureBasis === '+'
                    ? 'border-alice-500 bg-alice-500/15 text-alice-300 shadow-[0_0_15px_rgba(96,165,250,0.15)]'
                    : 'border-abyss-700 bg-abyss-850/60 text-ink-400 hover:border-abyss-600'
                }`}
              >
                <div className="text-xs font-bold">+ Rectilinear Basis</div>
                <div className="text-[10px] text-ink-500 mt-0.5">{'{ 0° |H⟩, 90° |V⟩ }'}</div>
              </button>
              <button
                onClick={() => setMeasureBasis('×')}
                className={`rounded-xl p-2.5 text-center font-mono transition-all border ${
                  measureBasis === '×'
                    ? 'border-bob-500 bg-bob-500/15 text-bob-300 shadow-[0_0_15px_rgba(167,139,250,0.15)]'
                    : 'border-abyss-700 bg-abyss-850/60 text-ink-400 hover:border-abyss-600'
                }`}
              >
                <div className="text-xs font-bold">× Diagonal Basis</div>
                <div className="text-[10px] text-ink-500 mt-0.5">{'{ +45° |D⟩, −45° |A⟩ }'}</div>
              </button>
            </div>
          </div>

          {/* Probability Indicator */}
          <div className="rounded-xl border border-abyss-700/60 bg-black/25 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-300">Expected Measurement:</span>
              <span className={`font-mono text-[10.5px] font-bold px-2 py-0.5 rounded ${
                isBasisMatch
                  ? 'bg-pass-500/20 text-pass-400 border border-pass-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {isBasisMatch ? 'MATCHING BASIS (100% PREDICTABLE)' : 'WRONG BASIS (50/50 RANDOM)'}
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-ink-400">Probability of Bit 0:</span>
                <span className="text-ink-200 font-bold">{p0Percent}%</span>
              </div>
              <div className="h-2 rounded-full bg-abyss-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-alice-500 to-signal-400 transition-all duration-300"
                  style={{ width: `${born.probabilityZero * 100}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] font-mono pt-1">
                <span className="text-ink-400">Probability of Bit 1:</span>
                <span className="text-ink-200 font-bold">{p1Percent}%</span>
              </div>
              <div className="h-2 rounded-full bg-abyss-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-bob-500 to-purple-400 transition-all duration-300"
                  style={{ width: `${born.probabilityOne * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Trigger Buttons */}
          <div className="space-y-2">
            <button
              onClick={fireSinglePhoton}
              disabled={isFiring}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-alice-500/60 bg-alice-500/20 px-4 py-2.5 font-mono text-xs font-bold text-alice-200 hover:bg-alice-500/30 hover:border-alice-400 active:scale-[0.99] transition-all shadow-[0_0_15px_rgba(96,165,250,0.15)]"
            >
              <Zap className={`size-4 text-alice-400 ${isFiring ? 'animate-bounce' : ''}`} />
              <span>Fire &amp; Measure 1 Photon</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fireBatch(100)}
                className="flex-1 rounded-lg border border-abyss-700 bg-abyss-850/60 py-1.5 text-center font-mono text-xs text-ink-300 hover:text-white hover:border-abyss-600 transition-all"
              >
                +100 Shots
              </button>
              <button
                onClick={resetAll}
                className="grid size-8 place-items-center rounded-lg border border-abyss-700 bg-abyss-850/60 text-ink-400 hover:text-eve-400 transition-all"
                title="Reset counts"
              >
                <RotateCcw className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Outcome & Clean Bar */}
        <div className="p-6 space-y-5 flex flex-col justify-between">
          {/* Collapse Result Box */}
          <div className="rounded-2xl border border-abyss-700/60 bg-gradient-to-b from-abyss-900/40 to-black/30 p-5 text-center space-y-3">
            <span className="font-mono text-xs text-ink-400 uppercase tracking-wider block">
              Measurement Outcome
            </span>

            <div className="flex items-center justify-center gap-4 py-2">
              <div className="px-3 py-2 rounded-lg border border-abyss-700/60 bg-black/40">
                <span className="text-[10px] text-ink-500 font-mono block">Alice Sent</span>
                <span className="font-mono text-sm font-bold text-alice-300">{stateObj.label}</span>
              </div>

              <ArrowRight className="size-4 text-ink-500" />

              <div className={`px-4 py-2 rounded-xl border transition-all duration-300 ${
                lastOutcome
                  ? 'border-pass-500/50 bg-pass-500/10 shadow-[0_0_20px_rgba(74,222,128,0.15)]'
                  : 'border-abyss-800 bg-black/20 text-ink-500'
              }`}>
                <span className="text-[10px] text-ink-500 font-mono block">Detector Readout</span>
                <span className={`font-mono text-base font-bold ${lastOutcome ? 'text-pass-300' : 'text-ink-500'}`}>
                  {lastOutcome ? `Bit ${lastOutcome.bit} · ${lastOutcome.stateName}` : 'Ready for Photon'}
                </span>
              </div>
            </div>

            <p className="text-xs text-ink-400 max-w-md mx-auto">
              {isBasisMatch
                ? 'Because the basis matched, the photon state was measured without disturbance.'
                : 'Because the basis was different, the photon was forced to randomly collapse!'}
            </p>
          </div>

          {/* Multi-Shot Statistics (If any shots fired) */}
          <div className="rounded-xl border border-abyss-700/60 bg-black/20 p-4 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono font-semibold text-ink-300">
                Accumulated Results ({counts.total.toLocaleString()} photons tested):
              </span>
              <span className="font-mono text-[11px] text-ink-400">
                Bit 0: <strong className="text-alice-300">{counts.c0}</strong> · Bit 1: <strong className="text-bob-300">{counts.c1}</strong>
              </span>
            </div>

            {counts.total > 0 ? (
              <div className="space-y-1 pt-1">
                <div className="h-2.5 rounded-full bg-abyss-800 overflow-hidden flex">
                  <div
                    className="h-full bg-alice-500 transition-all duration-200"
                    style={{ width: `${(counts.c0 / counts.total) * 100}%` }}
                    title={`Bit 0: ${((counts.c0 / counts.total) * 100).toFixed(1)}%`}
                  />
                  <div
                    className="h-full bg-bob-500 transition-all duration-200"
                    style={{ width: `${(counts.c1 / counts.total) * 100}%` }}
                    title={`Bit 1: ${((counts.c1 / counts.total) * 100).toFixed(1)}%`}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-ink-500">
                  <span>Actual: {((counts.c0 / counts.total) * 100).toFixed(1)}% Bit 0</span>
                  <span>Expected: {p0Percent}% Bit 0</span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-ink-500 pt-1">
                Click &ldquo;+100 Shots&rdquo; to test how empirical quantum detections converge to theory.
              </p>
            )}
          </div>

          {/* Key Takeaway Banner */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3.5 flex items-start gap-3">
            <ShieldAlert className="size-4.5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-ink-300 leading-relaxed">
              <strong className="text-amber-300">Why Eve Can&apos;t Eavesdrop Silently:</strong> Eve cannot measure without choosing a basis. Half the time she picks the wrong basis, forcing Alice&apos;s photon to collapse into a random state. When Bob receives it, this manifests as an unmistakable 25% error spike!
            </div>
          </div>

          {/* Collapsible Math Accordion */}
          <div>
            <button
              onClick={() => setShowMath(!showMath)}
              className="w-full flex items-center justify-between text-xs font-mono text-ink-400 hover:text-ink-200 py-1 transition-colors"
            >
              <span>{showMath ? '▼ Hide Born Rule Formula' : '▶ View Born Rule Formula'}</span>
              {showMath ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>
            {showMath && (
              <div className="mt-2 p-3 rounded-lg border border-abyss-800 bg-black/40 text-[11px] font-mono text-ink-400 space-y-1">
                <div>Probability Axiom: P(m) = |⟨m|ψ⟩|²</div>
                <div>Rectilinear (+): P(0) = cos²(θ/2), &nbsp; P(1) = sin²(θ/2)</div>
                <div>Diagonal (×): P(+) = ½(1 + sin θ cos φ)</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
