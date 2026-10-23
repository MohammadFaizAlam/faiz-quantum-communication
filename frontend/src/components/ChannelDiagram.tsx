import { ArrowRight, Eye, Zap, Radio, Cpu, User } from 'lucide-react'
import type { PhotonRow } from '../types'
import { Panel, SectionTitle } from './ui'

function BasisGlyph({ basis, actor }: { basis: '+' | 'x'; actor: 'alice' | 'bob' | 'eve' }) {
  const color =
    actor === 'alice' ? 'text-alice-400 bg-alice-500/10 border-alice-500/30' : actor === 'bob' ? 'text-bob-400 bg-bob-500/10 border-bob-500/30' : 'text-eve-400 bg-eve-500/10 border-eve-500/30'
  return (
    <span
      className={`inline-grid size-5.5 place-items-center rounded-md border font-mono text-xs font-bold ${color}`}
      title={`basis ${basis}`}
    >
      {basis === '+' ? '+' : '×'}
    </span>
  )
}

function BitCell({ bit }: { bit: 0 | 1 | null }) {
  return (
    <span className="tnum inline-grid size-6 place-items-center rounded-md border border-abyss-600/80 bg-abyss-950 font-mono text-xs font-bold text-ink-100 shadow-sm">
      {bit ?? '·'}
    </span>
  )
}

/**
 * Alice → quantum channel (with optional Eve) → Bob.
 * Shows the first few photons of the actual run so the audience can trace
 * individual states: Alice's preparation, Eve's interference (if any) and
 * Bob's measurement.
 */
export function ChannelDiagram({ photons, eveEnabled }: { photons: PhotonRow[]; eveEnabled: boolean }) {
  const sample = photons.slice(0, 8)
  const interceptedCount = photons.filter((p) => p.eve_intercepted).length

  return (
    <Panel className="fade-in-up">
      <div className="p-4 sm:p-6">
        <SectionTitle
          tag="PHYSICAL LINK"
          eyebrow="quantum channel"
          title="Optical Fiber Qubit Transmission"
          icon={<Radio className="size-4" aria-hidden />}
        >
          <span className="font-mono text-xs text-ink-400 font-semibold px-2 py-1 rounded bg-black/30 border border-abyss-700/60">
            FIRST {sample.length} OF {photons.length} QUBITS
          </span>
        </SectionTitle>

        {/* 3-station channel visualizer */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_1fr_140px] md:grid-cols-[160px_1fr_160px] items-stretch sm:gap-4">
          {/* Alice */}
          <div className="flex sm:flex-col items-center justify-between sm:justify-center rounded-xl border border-alice-500/40 bg-gradient-to-b from-alice-500/10 to-alice-500/5 p-3 sm:p-4 text-left sm:text-center transition-all hover:border-alice-400/60 shadow-[0_0_15px_rgba(59,130,246,0.08)]">
            <div className="flex sm:flex-col items-center gap-2.5 sm:gap-0">
              <div className="grid size-8 sm:size-9 place-items-center rounded-lg bg-alice-500/20 border border-alice-500/40 sm:mb-2 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                <User className="size-4 sm:size-4.5 text-alice-300" aria-hidden />
              </div>
              <div>
                <div className="font-mono text-[11px] font-bold tracking-[0.2em] text-alice-400 uppercase">Alice</div>
                <div className="text-[11.5px] text-ink-200 font-medium sm:mt-1">Prepares Qubits</div>
              </div>
            </div>
            <div className="rounded px-2 py-0.5 font-mono text-[10px] text-alice-300 bg-alice-500/15 border border-alice-500/30 sm:mt-2">
              |0⟩ |1⟩ |+⟩ |−⟩
            </div>
          </div>

          {/* Channel with Animated SVG Laser Beam */}
          <div className="relative flex flex-col justify-center overflow-hidden rounded-xl border border-abyss-700/80 bg-gradient-to-b from-abyss-900/90 to-abyss-950/95 p-3 sm:p-4 min-h-[110px] sm:min-h-0 shadow-inner">
            {/* Ambient grid lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

            {/* Continuous SVG Laser Beam */}
            <svg
              className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-8 pointer-events-none z-0"
              preserveAspectRatio="none"
              viewBox="0 0 400 32"
            >
              <defs>
                <linearGradient id="laserGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#22d3ee" stopOpacity="1" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
                </linearGradient>
                <filter id="laserBlur">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* Outer glow line */}
              <line
                x1="20"
                y1="16"
                x2="380"
                y2="16"
                stroke="url(#laserGlow)"
                strokeWidth="4"
                strokeOpacity="0.4"
                filter="url(#laserBlur)"
              />
              {/* Animated particle flow line */}
              <line
                x1="20"
                y1="16"
                x2="380"
                y2="16"
                stroke="#67e8f9"
                strokeWidth="2"
                className="laser-stream"
              />
              {/* Eve Tap branching if active */}
              {eveEnabled && (
                <>
                  <line
                    x1="200"
                    y1="16"
                    x2="200"
                    y2="30"
                    stroke="#ef4444"
                    strokeWidth="2"
                    className="laser-stream-red"
                  />
                  <circle cx="200" cy="16" r="4" fill="#f43f5e" className="animate-pulse" />
                </>
              )}
            </svg>

            {/* Photon dots floating on laser line */}
            <div className="relative flex items-center justify-between gap-1 z-10 px-3 overflow-x-auto scrollbar-none py-1.5">
              {sample.map((p) => (
                <div
                  key={p.index}
                  className="tnum flex flex-col items-center group cursor-default shrink-0 sm:shrink"
                  title={`Photon #${p.index}: ${p.alice_state} (Basis: ${p.alice_basis})`}
                >
                  <div className="relative">
                    <span
                      className={`block size-3 rounded-full transition-transform duration-200 group-hover:scale-150 ${
                        p.eve_intercepted
                          ? 'bg-eve-400 shadow-[0_0_12px_rgba(239,68,68,0.9)] animate-pulse'
                          : 'bg-signal-400 shadow-[0_0_10px_rgba(34,211,238,0.9)]'
                      }`}
                    />
                    <span className="absolute -inset-1 rounded-full bg-signal-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="mt-2 font-mono text-[9.5px] text-ink-300 font-bold group-hover:text-signal-300">
                    #{p.index}
                  </span>
                </div>
              ))}
            </div>

            {/* Eve intercept status ticker */}
            {eveEnabled ? (
              <div className="relative mt-2 flex items-center justify-center gap-2 rounded-lg border border-eve-500/40 bg-gradient-to-r from-eve-500/15 via-eve-500/25 to-eve-500/15 py-1 px-3 font-mono text-[10.5px] sm:text-[11px] text-eve-300 shadow-[0_0_20px_rgba(239,68,68,0.15)] text-center">
                <Eye className="size-3.5 shrink-0 text-eve-400 animate-pulse" aria-hidden />
                <span>
                  <strong className="text-eve-200">INTERCEPT TAP ACTIVE:</strong> Eve sampled {interceptedCount}/{photons.length} qubits ({Math.round((interceptedCount / photons.length) * 100)}%)
                </span>
              </div>
            ) : (
              <div className="relative mt-2 text-center font-mono text-[10px] sm:text-[10.5px] text-ink-500 flex items-center justify-center gap-2">
                <span className="size-1.5 rounded-full bg-pass-400 animate-ping" />
                <span>Coherent single-mode fiber · Zero eavesdropping interference</span>
              </div>
            )}
          </div>

          {/* Bob */}
          <div className="flex sm:flex-col items-center justify-between sm:justify-center rounded-xl border border-bob-500/40 bg-gradient-to-b from-bob-500/10 to-bob-500/5 p-3 sm:p-4 text-left sm:text-center transition-all hover:border-bob-400/60 shadow-[0_0_15px_rgba(139,92,246,0.08)]">
            <div className="flex sm:flex-col items-center gap-2.5 sm:gap-0">
              <div className="grid size-8 sm:size-9 place-items-center rounded-lg bg-bob-500/20 border border-bob-500/40 sm:mb-2 shadow-[0_0_10px_rgba(139,92,246,0.2)]">
                <Cpu className="size-4 sm:size-4.5 text-bob-300" aria-hidden />
              </div>
              <div>
                <div className="font-mono text-[11px] font-bold tracking-[0.2em] text-bob-400 uppercase">Bob</div>
                <div className="text-[11.5px] text-ink-200 font-medium sm:mt-1">Measures Qubits</div>
              </div>
            </div>
            <div className="rounded px-2 py-0.5 font-mono text-[10px] text-bob-300 bg-bob-500/15 border border-bob-500/30 sm:mt-2">
              Random Bases
            </div>
          </div>
        </div>

        {/* Per-photon trace table */}
        <div className="mt-6 overflow-x-auto rounded-xl border border-abyss-700/50 bg-abyss-900/40">
          <table className="w-full min-w-[620px] border-collapse text-left">
            <thead>
              <tr className="border-b border-abyss-700/60 bg-abyss-850/60 font-mono text-[10.5px] tracking-wider text-ink-400 uppercase">
                <th className="py-2.5 px-3 font-semibold">#</th>
                <th className="py-2.5 px-3 font-semibold">Alice Bit</th>
                <th className="py-2.5 px-3 font-semibold">Alice Basis</th>
                <th className="py-2.5 px-3 font-semibold">State Sent</th>
                {eveEnabled && <th className="py-2.5 px-3 font-semibold">Eve Basis</th>}
                <th className="py-2.5 px-3 font-semibold">Bob Basis</th>
                <th className="py-2.5 px-3 font-semibold">Bob Result</th>
                <th className="py-2.5 px-3 font-semibold">Verdict</th>
              </tr>
            </thead>
            <tbody className="font-mono text-xs divide-y divide-abyss-800/60">
              {sample.map((p) => {
                const verdict = !p.sifted
                  ? { label: 'Basis mismatch · Discarded', cls: 'text-ink-500 bg-abyss-800/40 border-abyss-700' }
                  : p.tested
                    ? { label: 'Revealed in test', cls: 'text-warn-400 bg-warn-400/10 border-warn-400/30' }
                    : p.retained
                      ? { label: 'Retained key bit', cls: 'text-pass-400 bg-pass-400/10 border-pass-400/30' }
                      : { label: 'Sifted', cls: 'text-ink-300 bg-abyss-800 border-abyss-600' }

                return (
                  <tr key={p.index} className="transition-colors hover:bg-abyss-800/30">
                    <td className="tnum py-2 px-3 text-ink-500 font-semibold">{p.index}</td>
                    <td className="py-2 px-3">
                      <BitCell bit={p.alice_bit} />
                    </td>
                    <td className="py-2 px-3">
                      <BasisGlyph basis={p.alice_basis} actor="alice" />
                    </td>
                    <td className="py-2 px-3 text-signal-300 font-semibold" title={p.alice_state}>
                      {p.alice_state.split(' ')[0]}
                    </td>
                    {eveEnabled && (
                      <td className="py-2 px-3">
                        {p.eve_intercepted ? (
                          <span className="inline-flex items-center gap-1.5 text-eve-400">
                            <BasisGlyph basis={p.eve_basis ?? '+'} actor="eve" />
                            <Zap className="size-3 text-eve-400" aria-hidden />
                          </span>
                        ) : (
                          <span className="text-ink-600">—</span>
                        )}
                      </td>
                    )}
                    <td className="py-2 px-3">
                      <BasisGlyph basis={p.bob_basis} actor="bob" />
                    </td>
                    <td className="py-2 px-3">
                      <BitCell bit={p.bob_result} />
                    </td>
                    <td className="py-2 px-3">
                      <span className={`inline-block rounded-md border px-2 py-0.5 text-[10.5px] font-semibold ${verdict.cls}`}>
                        {verdict.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-4 flex items-center gap-2 text-[12px] text-ink-400">
          <ArrowRight className="size-3.5 text-signal-400 shrink-0" aria-hidden />
          <span>
            Bob keeps a bit only when his basis matches Alice&apos;s — this is <strong className="text-ink-200">sifting</strong>, and it never requires announcing secret bit values.
          </span>
        </p>
      </div>
    </Panel>
  )
}
