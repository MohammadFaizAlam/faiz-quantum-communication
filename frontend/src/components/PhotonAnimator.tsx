import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, SkipForward, RotateCcw, Zap, Eye } from 'lucide-react'
import type { PhotonRow } from '../types'
import { Panel, SectionTitle } from './ui'

type Speed = 0.5 | 1 | 2

const STAGE_LABELS = ['Preparing', 'Transmitting', 'Eve Intercepts', 'Bob Measures', 'Verdict'] as const
type Stage = 0 | 1 | 2 | 3 | 4

const SPEED_DURATIONS: Record<Speed, number> = { 0.5: 1600, 1: 900, 2: 450 }

const POLARIZATION_LINES: Record<string, { angle: number; label: string }> = {
  '|0⟩ (H)': { angle: 0, label: '0°' },
  '|1⟩ (V)': { angle: 90, label: '90°' },
  '|+⟩ (D)': { angle: 45, label: '45°' },
  '|−⟩ (A)': { angle: 135, label: '135°' },
}

function getPolarization(state: string) {
  for (const [key, val] of Object.entries(POLARIZATION_LINES)) {
    if (state.includes(key) || state.startsWith(key.split(' ')[0])) return val
  }
  // Fallback: parse from the state string
  if (state.includes('H') || state.includes('|0⟩')) return { angle: 0, label: '0° H' }
  if (state.includes('V') || state.includes('|1⟩')) return { angle: 90, label: '90° V' }
  if (state.includes('+') || state.includes('|+⟩')) return { angle: 45, label: '45° D' }
  if (state.includes('−') || state.includes('|−⟩')) return { angle: 135, label: '135° A' }
  return { angle: 0, label: state }
}

function PolarizationDisk({ angle, size = 48, color = '#22d3ee', glow = false, collapsed = false }: {
  angle: number
  size?: number
  color?: string
  glow?: boolean
  collapsed?: boolean
}) {
  const r = size / 2 - 4
  const cx = size / 2
  const cy = size / 2
  const rad = (angle * Math.PI) / 180
  const x1 = cx + r * Math.cos(rad)
  const y1 = cy - r * Math.sin(rad)
  const x2 = cx - r * Math.cos(rad)
  const y2 = cy + r * Math.sin(rad)

  return (
    <svg width={size} height={size} className="shrink-0" aria-hidden>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeOpacity={0.2}
        strokeWidth={1.5}
      />
      {glow && (
        <circle
          cx={cx}
          cy={cy}
          r={r - 2}
          fill={color}
          fillOpacity={0.06}
        />
      )}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={collapsed ? 2.5 : 2}
        strokeLinecap="round"
        style={{
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          filter: glow ? `drop-shadow(0 0 4px ${color})` : undefined,
        }}
      />
      {/* Arrow tip for direction */}
      <circle
        cx={x1}
        cy={y1}
        r={2.5}
        fill={color}
        style={{ transition: 'all 0.4s ease' }}
      />
    </svg>
  )
}

function FilterGlyph({ basis, color }: { basis: '+' | 'x'; color: string }) {
  return (
    <div
      className="grid size-6 sm:size-8 place-items-center rounded-md border font-mono text-xs sm:text-sm font-bold"
      style={{ borderColor: `${color}40`, background: `${color}15`, color }}
    >
      {basis === '+' ? '+' : '×'}
    </div>
  )
}

export function PhotonAnimator({ photons, eveEnabled }: { photons: PhotonRow[]; eveEnabled: boolean }) {
  const displayPhotons = photons.slice(0, 20)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [stage, setStage] = useState<Stage>(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<Speed>(1)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const photon = displayPhotons[currentIdx]
  const stageLabels = eveEnabled && photon?.eve_intercepted
    ? STAGE_LABELS
    : [...STAGE_LABELS.slice(0, 2), ...STAGE_LABELS.slice(3)]

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Advance one tick
  const advance = useCallback(() => {
    setStage((prev) => {
      const maxStage = (eveEnabled && displayPhotons[currentIdx]?.eve_intercepted ? 4 : 3) as Stage
      if (prev < maxStage) return (prev + 1) as Stage
      // Move to next photon
      setCurrentIdx((pi) => {
        if (pi < displayPhotons.length - 1) {
          return pi + 1
        }
        setPlaying(false)
        return pi
      })
      return 0 as Stage
    })
  }, [currentIdx, displayPhotons, eveEnabled])

  // Auto-play loop
  useEffect(() => {
    clearTimer()
    if (!playing) return
    timerRef.current = setTimeout(advance, SPEED_DURATIONS[speed])
    return clearTimer
  }, [playing, stage, currentIdx, speed, advance, clearTimer])

  const handlePlayPause = () => setPlaying((p) => !p)

  const handleStep = () => {
    setPlaying(false)
    advance()
  }

  const handleReset = () => {
    setPlaying(false)
    clearTimer()
    setCurrentIdx(0)
    setStage(0)
  }

  if (!photon) return null

  const alicePol = getPolarization(photon.alice_state)

  // What Eve measures: if she used a wrong basis, the angle snaps
  const eveCollapsed = photon.eve_intercepted && photon.eve_basis !== photon.alice_basis
  const eveAngle = photon.eve_intercepted
    ? photon.eve_basis === '+'
      ? photon.eve_result === 0 ? 0 : 90
      : photon.eve_result === 0 ? 45 : 135
    : alicePol.angle

  // What arrives at Bob
  const arrivingAngle = photon.eve_intercepted ? eveAngle : alicePol.angle

  // Current effective stage index for non-Eve runs
  const effectiveStage = (() => {
    if (!eveEnabled || !photon.eve_intercepted) {
      // Stages: 0=preparing, 1=transmitting, 2=bob measures, 3=verdict
      return stage
    }
    return stage
  })()

  // Determine which station is "active"
  const aliceActive = effectiveStage === 0
  const fiberActive = effectiveStage === 1
  const eveActive = eveEnabled && photon.eve_intercepted && effectiveStage === 2
  const bobActive = eveEnabled && photon.eve_intercepted ? effectiveStage === 3 : effectiveStage === 2
  const verdictActive = eveEnabled && photon.eve_intercepted ? effectiveStage === 4 : effectiveStage === 3

  // Photon beam position (0-100%)
  const beamProgress = (() => {
    if (aliceActive) return 0
    if (fiberActive) return eveEnabled && photon.eve_intercepted ? 40 : 80
    if (eveActive) return 55
    if (bobActive) return 100
    if (verdictActive) return 100
    return 0
  })()

  const verdict = !photon.sifted
    ? { label: 'Discarded (basis mismatch)', color: 'text-ink-500', bg: 'bg-abyss-800' }
    : photon.tested
      ? { label: 'Revealed in test sample', color: 'text-warn-400', bg: 'bg-warn-400/10' }
      : photon.retained
        ? { label: 'Retained as secret key bit ✓', color: 'text-pass-400', bg: 'bg-pass-400/10' }
        : { label: 'Sifted (basis matched)', color: 'text-ink-300', bg: 'bg-abyss-800' }

  return (
    <Panel className="fade-in-up">
      <div className="p-4 sm:p-6">
        <SectionTitle
          eyebrow="interactive simulation"
          title="Photon Transmission Animator"
          icon={<Zap className="size-4" aria-hidden />}
        >
          <div className="flex items-center gap-2 text-[12px] font-mono text-ink-400">
            Photon <strong className="text-ink-200">{currentIdx + 1}</strong> / {displayPhotons.length}
          </div>
        </SectionTitle>

        {/* Controls bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePlayPause}
                className="grid size-8 sm:size-9 place-items-center rounded-lg border border-signal-500/30 bg-signal-500/10 text-signal-300 transition-all hover:bg-signal-500/20 hover:border-signal-400/50"
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing
                  ? <Pause className="size-3.5 sm:size-4" aria-hidden />
                  : <Play className="size-3.5 sm:size-4 ml-0.5" aria-hidden />}
              </button>
              <button
                type="button"
                onClick={handleStep}
                className="grid size-8 sm:size-9 place-items-center rounded-lg border border-abyss-600 bg-abyss-800/60 text-ink-300 transition-all hover:border-abyss-500 hover:text-ink-100"
                aria-label="Step forward"
              >
                <SkipForward className="size-3.5 sm:size-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="grid size-8 sm:size-9 place-items-center rounded-lg border border-abyss-600 bg-abyss-800/60 text-ink-300 transition-all hover:border-abyss-500 hover:text-ink-100"
                aria-label="Reset"
              >
                <RotateCcw className="size-3.5 sm:size-4" aria-hidden />
              </button>
            </div>

            {/* Speed selector */}
            <div className="flex items-center gap-1 rounded-lg border border-abyss-700 bg-abyss-900/60 p-0.5">
              {([0.5, 1, 2] as Speed[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpeed(s)}
                  className={`rounded-md px-2.5 sm:px-3 py-1 font-mono text-[10.5px] sm:text-[11px] font-semibold transition-all ${
                    speed === s
                      ? 'bg-signal-500/20 text-signal-300 border border-signal-500/30'
                      : 'text-ink-500 hover:text-ink-300 border border-transparent'
                  }`}
                >
                  {s}×
                </button>
              ))}
            </div>
          </div>

          {/* Stage progress dots */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 max-w-full">
            {stageLabels.map((label, i) => (
              <div
                key={label}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold font-mono transition-all ${
                  i === effectiveStage
                    ? 'bg-signal-500/20 text-signal-300 border border-signal-500/30'
                    : i < effectiveStage
                      ? 'text-ink-500 bg-abyss-800/60'
                      : 'text-ink-600'
                }`}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Main visualization area */}
        <div className="relative rounded-xl border border-abyss-700/50 bg-abyss-900/40 overflow-hidden">
          {/* The photon beam strip */}
          <div className="relative h-40 sm:h-48">
            {/* Background fiber line */}
            <div className="absolute top-1/2 left-[10%] right-[10%] h-px bg-gradient-to-r from-alice-500/30 via-abyss-500/40 to-bob-500/30 -translate-y-1/2" />
            <div className="absolute top-1/2 left-[10%] right-[10%] h-px bg-gradient-to-r from-alice-500/10 via-abyss-500/10 to-bob-500/10 -translate-y-1/2 blur-sm" />

            {/* Traveling photon glow dot */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all ease-out"
              style={{
                left: `${10 + beamProgress * 0.8}%`,
                transitionDuration: `${SPEED_DURATIONS[speed] * 0.6}ms`,
              }}
            >
              <div className="relative">
                <div className="size-3 rounded-full bg-signal-400 shadow-[0_0_12px_4px_rgba(34,211,238,0.7)]" />
                <div className="absolute -inset-2 rounded-full bg-signal-400/20 animate-ping" style={{ animationDuration: '1.5s' }} />
              </div>
            </div>

            {/* Eve interception flash */}
            {eveActive && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="size-16 rounded-full bg-eve-500/20 border border-eve-500/40 animate-ping" style={{ animationDuration: '0.8s' }} />
              </div>
            )}

            {/* ALICE station */}
            <div className={`absolute left-[3%] top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 transition-opacity duration-300 ${aliceActive ? 'opacity-100' : 'opacity-60'}`}>
              <PolarizationDisk
                angle={alicePol.angle}
                size={52}
                color="#60a5fa"
                glow={aliceActive}
              />
              <div className="text-center">
                <div className="font-mono text-[10px] font-bold tracking-wider text-alice-400 uppercase">Alice</div>
                <div className="font-mono text-[10px] text-ink-500">
                  Bit: <span className="text-alice-300 font-bold">{photon.alice_bit}</span>
                </div>
                <FilterGlyph basis={photon.alice_basis} color="#60a5fa" />
              </div>
            </div>

            {/* EVE station (conditionally) */}
            {eveEnabled && photon.eve_intercepted && (
              <div className={`absolute left-[43%] top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center gap-2 transition-opacity duration-300 ${eveActive ? 'opacity-100' : effectiveStage > 2 ? 'opacity-70' : 'opacity-30'}`}>
                <PolarizationDisk
                  angle={eveAngle}
                  size={52}
                  color="#f87171"
                  glow={eveActive}
                  collapsed={eveCollapsed}
                />
                <div className="text-center">
                  <div className="font-mono text-[10px] font-bold tracking-wider text-eve-400 uppercase flex items-center gap-1">
                    <Eye className="size-3" aria-hidden />
                    Eve
                  </div>
                  {effectiveStage >= 2 && (
                    <>
                      <FilterGlyph basis={photon.eve_basis ?? '+'} color="#f87171" />
                      {eveCollapsed && (
                        <div className="mt-1 text-[9px] font-bold text-eve-400 animate-pulse">
                          WRONG BASIS!
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* BOB station */}
            <div className={`absolute right-[3%] top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 transition-opacity duration-300 ${bobActive || verdictActive ? 'opacity-100' : 'opacity-40'}`}>
              <PolarizationDisk
                angle={bobActive || verdictActive ? arrivingAngle : 0}
                size={52}
                color="#a78bfa"
                glow={bobActive}
              />
              <div className="text-center">
                <div className="font-mono text-[10px] font-bold tracking-wider text-bob-400 uppercase">Bob</div>
                {(bobActive || verdictActive) && (
                  <>
                    <div className="font-mono text-[10px] text-ink-500">
                      Got: <span className="text-bob-300 font-bold">{photon.bob_result}</span>
                    </div>
                    <FilterGlyph basis={photon.bob_basis} color="#a78bfa" />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Narrative strip at the bottom */}
          <div className="border-t border-abyss-700/50 bg-abyss-850/60 px-4 sm:px-5 py-3 sm:py-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-[12.5px] sm:text-[13px] text-ink-200 leading-relaxed max-w-xl">
                {aliceActive && (
                  <>
                    Alice randomly picks bit <strong className="text-alice-400 font-mono">{photon.alice_bit}</strong> and
                    chooses the <strong className="text-alice-400">{photon.alice_basis === '+' ? 'Rectilinear (+)' : 'Diagonal (×)'}</strong> basis,
                    polarizing the photon at <strong className="text-signal-300">{alicePol.label}</strong>.
                  </>
                )}
                {fiberActive && (
                  <>
                    The single photon is transmitted down the quantum fiber channel
                    {eveEnabled && photon.eve_intercepted
                      ? <> — but <strong className="text-eve-400">Eve is listening!</strong></>
                      : <> — the channel is clear, no eavesdropper detected.</>
                    }
                  </>
                )}
                {eveActive && (
                  <>
                    Eve intercepts with the <strong className="text-eve-400">{photon.eve_basis === '+' ? 'Rectilinear (+)' : 'Diagonal (×)'}</strong> filter.
                    {eveCollapsed
                      ? <> <strong className="text-eve-400">Wrong guess!</strong> The photon's polarization collapses from {alicePol.label} into a random state — the original information is destroyed.</>
                      : <> Lucky guess — she picked the same basis as Alice, so the photon passes through undamaged.</>
                    }
                  </>
                )}
                {bobActive && (
                  <>
                    Bob measures with his own random <strong className="text-bob-400">{photon.bob_basis === '+' ? 'Rectilinear (+)' : 'Diagonal (×)'}</strong> filter
                    and reads bit <strong className="text-bob-400 font-mono">{photon.bob_result}</strong>.
                    {photon.basis_match
                      ? <> Their bases <strong className="text-pass-400">match</strong> — this photon is sifted.</> 
                      : <> Bases <strong className="text-ink-500">don't match</strong> — this photon will be discarded.</>
                    }
                  </>
                )}
                {verdictActive && (
                  <span className={verdict.color}>
                    <strong>{verdict.label}</strong>
                    {photon.basis_match && photon.bob_result !== photon.alice_bit && (
                      <> — <span className="text-eve-400 font-bold">Eve introduced a bit error here!</span></>
                    )}
                  </span>
                )}
              </div>

              {/* Photon index chips */}
              <div className="flex items-center gap-1 overflow-x-auto max-w-full scrollbar-none pb-0.5 shrink-0">
                {displayPhotons.slice(0, 12).map((p, i) => (
                  <button
                    key={p.index}
                    type="button"
                    onClick={() => {
                      setPlaying(false)
                      setCurrentIdx(i)
                      setStage(0)
                    }}
                    className={`size-6 shrink-0 rounded text-[10px] font-mono font-bold transition-all ${
                      i === currentIdx
                        ? 'bg-signal-500/25 text-signal-300 border border-signal-500/40'
                        : i < currentIdx
                          ? 'bg-abyss-800 text-ink-500 border border-abyss-700'
                          : 'text-ink-600 border border-transparent hover:text-ink-400'
                    }`}
                    title={`Jump to photon #${p.index}`}
                  >
                    {p.index}
                  </button>
                ))}
                {displayPhotons.length > 12 && (
                  <span className="grid size-6 shrink-0 place-items-center text-[10px] text-ink-600">…</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  )
}
