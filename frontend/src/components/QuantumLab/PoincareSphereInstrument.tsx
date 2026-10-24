import { useState, useMemo, useRef, useCallback } from 'react'
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react'
import {
  anglesToStokes,
  computeDensityMatrix,
  depolarizedDensityMatrix,
  BB84_STATES,
  formatComplex,
  type BB84StateName,
  type DensityMatrix,
} from './quantumPhysics'

function project3D(x: number, y: number, z: number, rx: number, ry: number) {
  const x1 = x * Math.cos(ry) - z * Math.sin(ry)
  const z1 = x * Math.sin(ry) + z * Math.cos(ry)
  const y1 = y * Math.cos(rx) - z1 * Math.sin(rx)
  const z2 = y * Math.sin(rx) + z1 * Math.cos(rx)
  const scale = 110
  return { px: x1 * scale + 160, py: -y1 * scale + 160, depth: z2 }
}

const PRESETS: { key: BB84StateName; name: string; basisName: string; bit: number; desc: string }[] = [
  { key: 'H', name: '|H⟩ Horizontal', basisName: 'Rectilinear (+)', bit: 0, desc: '0° polarization' },
  { key: 'V', name: '|V⟩ Vertical', basisName: 'Rectilinear (+)', bit: 1, desc: '90° polarization' },
  { key: 'D', name: '|D⟩ Diagonal', basisName: 'Diagonal (×)', bit: 0, desc: '+45° polarization' },
  { key: 'A', name: '|A⟩ Anti-Diag', basisName: 'Diagonal (×)', bit: 1, desc: '−45° polarization' },
]

export function PoincareSphereInstrument() {
  const [activePreset, setActivePreset] = useState<BB84StateName>('H')
  const [theta, setTheta] = useState(0)
  const [phi, setPhi] = useState(0)
  const [depol, setDepol] = useState(0)
  const [showAdvancedMath, setShowAdvancedMath] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  const [rotX, setRotX] = useState(0.35)
  const [rotY, setRotY] = useState(-0.55)

  const dragRef = useRef<{ dragging: boolean; lastX: number; lastY: number }>({
    dragging: false, lastX: 0, lastY: 0,
  })

  const stokes = useMemo(() => anglesToStokes(theta, phi), [theta, phi])
  const dm: DensityMatrix = useMemo(
    () => depol > 0
      ? depolarizedDensityMatrix(theta, phi, depol)
      : computeDensityMatrix(theta, phi),
    [theta, phi, depol],
  )

  const handleSelectPreset = useCallback((key: BB84StateName) => {
    setActivePreset(key)
    const s = BB84_STATES[key]
    setTheta(s.theta)
    setPhi(s.phi)
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragRef.current = { dragging: true, lastX: e.clientX, lastY: e.clientY }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.dragging) return
    const dx = e.clientX - dragRef.current.lastX
    const dy = e.clientY - dragRef.current.lastY
    setRotY(prev => prev + dx * 0.008)
    setRotX(prev => Math.max(-1.2, Math.min(1.2, prev + dy * 0.008)))
    dragRef.current.lastX = e.clientX
    dragRef.current.lastY = e.clientY
  }, [])

  const onPointerUp = useCallback(() => {
    dragRef.current.dragging = false
  }, [])

  // Sphere wireframe
  const sphereLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; opacity: number }[] = []
    for (let lat = -60; lat <= 60; lat += 30) {
      const r = Math.cos((lat * Math.PI) / 180)
      const h = Math.sin((lat * Math.PI) / 180)
      for (let i = 0; i < 36; i++) {
        const a1 = (i * 10 * Math.PI) / 180
        const a2 = ((i + 1) * 10 * Math.PI) / 180
        const p1 = project3D(r * Math.cos(a1), h, r * Math.sin(a1), rotX, rotY)
        const p2 = project3D(r * Math.cos(a2), h, r * Math.sin(a2), rotX, rotY)
        lines.push({ x1: p1.px, y1: p1.py, x2: p2.px, y2: p2.py, opacity: 0.08 + 0.06 * (p1.depth + p2.depth) / 2 })
      }
    }
    for (let lon = 0; lon < 180; lon += 45) {
      const a = (lon * Math.PI) / 180
      for (let i = 0; i < 36; i++) {
        const b1 = (i * 10 * Math.PI) / 180
        const b2 = ((i + 1) * 10 * Math.PI) / 180
        const p1 = project3D(Math.sin(b1) * Math.cos(a), Math.cos(b1), Math.sin(b1) * Math.sin(a), rotX, rotY)
        const p2 = project3D(Math.sin(b2) * Math.cos(a), Math.cos(b2), Math.sin(b2) * Math.sin(a), rotX, rotY)
        lines.push({ x1: p1.px, y1: p1.py, x2: p2.px, y2: p2.py, opacity: 0.08 + 0.06 * (p1.depth + p2.depth) / 2 })
      }
    }
    return lines
  }, [rotX, rotY])

  // Current state point
  const statePoint = useMemo(() => {
    const len = depol > 0 ? 1 - depol : 1
    return project3D(dm.blochX * len, dm.blochZ * len, dm.blochY * len, rotX, rotY)
  }, [dm, rotX, rotY, depol])

  const currentInfo = BB84_STATES[activePreset]

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-abyss-700/60 shadow-xl">
      {/* Title Bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-abyss-700/50 bg-gradient-to-r from-signal-500/[0.06] to-transparent">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-signal-500/15 border border-signal-500/30">
            <Sparkles className="size-4.5 text-signal-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-ink-100">
              Station 1: Photon Polarization &amp; The Bloch Sphere
            </h2>
            <p className="text-xs text-ink-400">
              How Alice encodes 0 and 1 into light photon angles
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowHelp(!showHelp)}
          className="text-xs font-mono text-ink-400 hover:text-signal-300 transition-colors flex items-center justify-center gap-1.5 p-2 sm:px-2.5 sm:py-1 rounded-lg border border-abyss-700 hover:border-signal-500/30 shrink-0"
          title={showHelp ? 'Hide Concept' : 'How It Works'}
          aria-label={showHelp ? 'Hide Concept' : 'How It Works'}
        >
          <Info className="size-3.5" />
          <span className="hidden sm:inline">{showHelp ? 'Hide Concept' : 'How It Works'}</span>
        </button>
      </div>

      {/* Explainer Box */}
      {showHelp && (
        <div className="px-5 py-3.5 bg-abyss-900/60 border-b border-abyss-700/40 text-xs text-ink-300 leading-relaxed space-y-1.5">
          <p>
            In BB84, Alice encodes binary bits into the <strong>polarization angle</strong> of individual light particles (photons). Every quantum state corresponds to a point on this 3D sphere:
          </p>
          <ul className="list-disc list-inside text-ink-400 space-y-0.5 ml-1">
            <li><strong>Rectilinear Basis (+)</strong>: Uses Horizontal (|H⟩ = 0) and Vertical (|V⟩ = 1).</li>
            <li><strong>Diagonal Basis (×)</strong>: Rotated by 45°: Diagonal (|+⟩ = 0) and Anti-Diagonal (|−⟩ = 1).</li>
          </ul>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid lg:grid-cols-[1fr_360px] divide-y lg:divide-y-0 lg:divide-x divide-abyss-700/50">
        {/* Left: Interactive 3D Sphere */}
        <div className="p-6 flex flex-col items-center justify-center">
          <div className="w-full max-w-[340px] relative select-none">
            <svg
              viewBox="0 0 320 320"
              className="w-full cursor-grab active:cursor-grabbing"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              style={{ touchAction: 'none' }}
            >
              <defs>
                <radialGradient id="sphere-glow-simple" cx="40%" cy="35%">
                  <stop offset="0%" stopColor="rgba(6,182,212,0.12)" />
                  <stop offset="100%" stopColor="rgba(6,182,212,0.01)" />
                </radialGradient>
              </defs>

              {/* Sphere outline */}
              <circle cx="160" cy="160" r="110" fill="url(#sphere-glow-simple)" stroke="rgba(6,182,212,0.2)" strokeWidth="1" />

              {/* Wireframe */}
              {sphereLines.map((l, i) => (
                <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                  stroke="rgba(6,182,212,0.3)" strokeWidth="0.5" opacity={Math.max(0.05, l.opacity)} />
              ))}

              {/* State Vector Line */}
              <line
                x1={project3D(0, 0, 0, rotX, rotY).px}
                y1={project3D(0, 0, 0, rotX, rotY).py}
                x2={statePoint.px}
                y2={statePoint.py}
                stroke="#22d3ee"
                strokeWidth="2.5"
              />

              {/* State Point Glowing Dot */}
              <circle cx={statePoint.px} cy={statePoint.py} r="7" fill="#22d3ee" opacity="0.4" />
              <circle cx={statePoint.px} cy={statePoint.py} r="4.5" fill="#22d3ee" stroke="white" strokeWidth="1.5" />
            </svg>

            <p className="text-center font-mono text-[11px] text-ink-500 mt-2">
              ✦ Click &amp; drag sphere to inspect in 3D
            </p>
          </div>
        </div>

        {/* Right: Clean Controls & State Readout */}
        <div className="p-6 space-y-5">
          {/* 4 Clean Presets */}
          <div>
            <span className="font-mono text-[11px] font-semibold text-ink-400 uppercase tracking-wider block mb-2.5">
              Select BB84 Photon State
            </span>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map(p => {
                const isSelected = activePreset === p.key
                return (
                  <button
                    key={p.key}
                    onClick={() => handleSelectPreset(p.key)}
                    className={`text-left rounded-xl p-3 border transition-all ${
                      isSelected
                        ? 'border-signal-500/80 bg-signal-500/15 shadow-[0_0_15px_rgba(6,182,212,0.15)] text-white'
                        : 'border-abyss-700 bg-abyss-850/60 text-ink-300 hover:border-abyss-600'
                    }`}
                  >
                    <div className="font-mono text-xs font-bold">{p.name}</div>
                    <div className="text-[10.5px] text-ink-400 mt-0.5">
                      Bit <strong className="text-signal-300">{p.bit}</strong> · {p.basisName}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Simple State Card */}
          <div className="rounded-xl border border-abyss-700/60 bg-black/25 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-400">Current Qubit State:</span>
              <span className="font-mono font-bold text-signal-300 text-sm">
                {currentInfo.label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-abyss-800 text-xs">
              <div>
                <span className="text-ink-500 block text-[10px] uppercase font-mono">Basis</span>
                <span className="font-bold text-ink-200">
                  {currentInfo.basis === '+' ? 'Rectilinear (+)' : 'Diagonal (×)'}
                </span>
              </div>
              <div>
                <span className="text-ink-500 block text-[10px] uppercase font-mono">Encoded Bit</span>
                <span className="font-bold text-pass-400 font-mono text-sm">
                  {currentInfo.bit}
                </span>
              </div>
            </div>

            {/* State Purity Bar */}
            <div className="pt-2 border-t border-abyss-800">
              <div className="flex justify-between text-[11px] font-mono mb-1">
                <span className="text-ink-400">Quantum State Purity</span>
                <span className="text-signal-300 font-bold">
                  {(dm.purity * 100).toFixed(0)}% {dm.purity >= 0.99 ? '(Pure State)' : '(Mixed)'}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-abyss-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-signal-500 to-pass-400 transition-all duration-300"
                  style={{ width: `${dm.purity * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Fiber Noise Slider */}
          <div className="rounded-xl border border-abyss-700/60 bg-black/20 p-3.5 space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-ink-300">Channel Noise / Disturbance</span>
              <span className="text-amber-400 font-bold">{(depol * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={depol}
              onChange={e => setDepol(+e.target.value)}
              className="w-full accent-signal-400"
            />
            <p className="text-[10px] text-ink-500 leading-tight">
              Higher noise degrades the photon towards the center of the sphere, reducing key reliability.
            </p>
          </div>

          {/* Collapsible Advanced Math */}
          <div className="pt-1">
            <button
              onClick={() => setShowAdvancedMath(!showAdvancedMath)}
              className="w-full flex items-center justify-between text-xs font-mono text-ink-400 hover:text-ink-200 py-1.5 px-2 rounded-lg hover:bg-abyss-800/40 transition-colors"
            >
              <span>{showAdvancedMath ? '▼ Hide Advanced Math' : '▶ View Stokes & Density Matrix'}</span>
              {showAdvancedMath ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>

            {showAdvancedMath && (
              <div className="mt-2 p-3 rounded-lg border border-abyss-800 bg-black/40 text-[11px] font-mono space-y-2 animate-fade-in">
                <div className="grid grid-cols-2 gap-2 text-ink-400">
                  <div>Stokes S₁: <strong className="text-ink-200">{stokes.S1.toFixed(2)}</strong></div>
                  <div>Stokes S₂: <strong className="text-ink-200">{stokes.S2.toFixed(2)}</strong></div>
                  <div>Stokes S₃: <strong className="text-ink-200">{stokes.S3.toFixed(2)}</strong></div>
                  <div>Entropy: <strong className="text-ink-200">{dm.vonNeumann.toFixed(2)} bits</strong></div>
                </div>
                <div className="text-[10px] text-ink-500 pt-1 border-t border-abyss-800">
                  Matrix: [{formatComplex(dm.rho[0][0].re, dm.rho[0][0].im, 2)}, {formatComplex(dm.rho[0][1].re, dm.rho[0][1].im, 2)}]
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
