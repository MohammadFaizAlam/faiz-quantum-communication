import { useState, useMemo } from 'react'
import {
  Activity,
  ShieldAlert,
  ShieldCheck,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  calculateOpticalChannel,
  generateDistanceCurve,
  type OpticalChannelParams,
} from './quantumPhysics'

const DEFAULT_PARAMS: OpticalChannelParams = {
  distanceKm: 50,
  attenuationDbPerKm: 0.2, // standard telecom fiber at 1550 nm
  darkCountRate: 100,
  gateWidthNs: 1,
  detectorEfficiency: 0.15,
  meanPhotonNumber: 0.1,
  repetitionRateMHz: 100,
}

function MetricCard({ label, value, unit, status = 'normal' }: {
  label: string
  value: string
  unit?: string
  status?: 'normal' | 'good' | 'bad'
}) {
  const colorClass =
    status === 'good'
      ? 'text-pass-400 border-pass-500/30 bg-pass-500/[0.06]'
      : status === 'bad'
      ? 'text-eve-400 border-eve-500/30 bg-eve-500/[0.06]'
      : 'text-ink-200 border-abyss-700/60 bg-black/25'

  return (
    <div className={`rounded-xl border p-3 ${colorClass}`}>
      <span className="text-[10px] font-mono text-ink-400 uppercase tracking-wider block">
        {label}
      </span>
      <div className="font-mono text-base font-bold mt-0.5">
        {value}
        {unit && <span className="text-xs text-ink-400 font-normal ml-1">{unit}</span>}
      </div>
    </div>
  )
}

export function OpticalFiberChannelLab() {
  const [distanceKm, setDistanceKm] = useState<number>(50)
  const [params, setParams] = useState(DEFAULT_PARAMS)
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false)
  const [showTheory, setShowTheory] = useState<boolean>(false)

  const activeParams = useMemo(() => ({
    ...params,
    distanceKm,
  }), [params, distanceKm])

  const result = useMemo(() => calculateOpticalChannel(activeParams), [activeParams])
  const maxPlotKm = Math.max(200, Math.ceil(result.maxSecureDistanceKm * 1.3))

  const curveData = useMemo(() => generateDistanceCurve(
    activeParams, maxPlotKm, 120
  ), [activeParams, maxPlotKm])

  const transmittanceDb = -activeParams.attenuationDbPerKm * distanceKm
  const isSecure = result.qber < 0.11 && result.secureKeyRate > 0

  // SVG Chart Setup
  const w = 500, h = 180, px = 45, pr = 20, pt = 15, pb = 30
  const plotW = w - px - pr, plotH = h - pt - pb

  const toX = (km: number) => px + (km / maxPlotKm) * plotW
  const toYQ = (q: number) => pt + (1 - Math.min(q, 0.3) / 0.3) * plotH

  const qberPath = curveData.map((d, i) =>
    `${i === 0 ? 'M' : 'L'}${toX(d.km).toFixed(1)},${toYQ(d.qber).toFixed(1)}`
  ).join(' ')

  const thresholdY = toYQ(0.11)

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-abyss-700/60 shadow-xl">
      {/* Title Bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-abyss-700/50 bg-gradient-to-r from-pass-500/[0.06] to-transparent">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-pass-500/15 border border-pass-500/30">
            <Activity className="size-4.5 text-pass-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-ink-100">
              Station 4: Optical Fiber &amp; Distance Limits
            </h2>
            <p className="text-xs text-ink-400">
              Why fiber-optic attenuation and noise floor limit quantum keys to ~100–150 km
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowTheory(!showTheory)}
          className="text-xs font-mono text-ink-400 hover:text-pass-300 transition-colors flex items-center justify-center gap-1.5 p-2 sm:px-2.5 sm:py-1 rounded-lg border border-abyss-700 hover:border-pass-500/30 shrink-0"
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
            Standard telecommunication optical fiber absorbs light at a rate of <strong>0.2 dB per kilometer</strong>. Over 100 km, 99% of photons are lost!
          </p>
          <p>
            Because quantum photons cannot be copied or amplified with classical repeaters (due to the No-Cloning theorem), detector noise eventually overwhelms the remaining photons and pushes the error rate past 11%.
          </p>
        </div>
      )}

      {/* 2-Column Workbench */}
      <div className="grid lg:grid-cols-[380px_1fr] divide-y lg:divide-y-0 lg:divide-x divide-abyss-700/50">
        {/* Left Column: Primary Slider & Clean Metrics */}
        <div className="p-6 space-y-5">
          {/* Main Distance Slider */}
          <div className="rounded-xl border border-abyss-700/60 bg-black/25 p-4 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-ink-300 font-semibold">Optical Fiber Length</span>
              <span className="text-pass-400 font-bold text-base">{distanceKm} km</span>
            </div>
            <input
              type="range"
              min="0"
              max="250"
              step="5"
              value={distanceKm}
              onChange={e => setDistanceKm(+e.target.value)}
              className="w-full accent-pass-400"
            />
            <div className="flex justify-between text-[10px] font-mono text-ink-500">
              <span>0 km (Direct)</span>
              <span>100 km (Intercity)</span>
              <span>250 km (Extreme)</span>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <MetricCard
              label="Optical Signal Loss"
              value={`${transmittanceDb.toFixed(1)} dB`}
              status={transmittanceDb > -25 ? 'good' : 'normal'}
            />
            <MetricCard
              label="Error Rate (QBER)"
              value={`${(result.qber * 100).toFixed(2)}%`}
              status={isSecure ? 'good' : 'bad'}
            />
            <MetricCard
              label="Max Secure Distance"
              value={`${result.maxSecureDistanceKm.toFixed(0)} km`}
              status="good"
            />
            <MetricCard
              label="Secret Key Yield"
              value={isSecure ? `${(result.secureKeyRate * 100).toFixed(1)}%` : '0%'}
              status={isSecure ? 'good' : 'bad'}
            />
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
                  <strong className="text-pass-300 font-bold block mb-0.5">Secure Transmission Possible</strong>
                  At {distanceKm} km, error rate is only {(result.qber * 100).toFixed(2)}% — safely below the 11% cutoff.
                </>
              ) : (
                <>
                  <strong className="text-eve-300 font-bold block mb-0.5">Maximum Distance Exceeded</strong>
                  At {distanceKm} km, fiber loss is so severe that detector dark counts dominate, pushing error past 11%. No secret key can be formed.
                </>
              )}
            </div>
          </div>

          {/* Collapsible Hardware Settings */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between text-xs font-mono text-ink-400 hover:text-ink-200 py-1 transition-colors"
            >
              <span>{showAdvanced ? '▼ Hide Hardware Settings' : '▶ Advanced Hardware Settings'}</span>
              {showAdvanced ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>
            {showAdvanced && (
              <div className="mt-2 p-3 rounded-lg border border-abyss-800 bg-black/40 text-[11px] font-mono space-y-3 animate-fade-in">
                <div>
                  <div className="flex justify-between text-ink-400 mb-1">
                    <span>Fiber Loss Rate (α):</span>
                    <span className="text-ink-200">{params.attenuationDbPerKm} dB/km</span>
                  </div>
                  <input
                    type="range"
                    min="0.15"
                    max="0.4"
                    step="0.01"
                    value={params.attenuationDbPerKm}
                    onChange={e => setParams(p => ({ ...p, attenuationDbPerKm: +e.target.value }))}
                    className="w-full accent-pass-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-ink-400 mb-1">
                    <span>Detector Dark Counts:</span>
                    <span className="text-ink-200">{params.darkCountRate} Hz</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    value={params.darkCountRate}
                    onChange={e => setParams(p => ({ ...p, darkCountRate: +e.target.value }))}
                    className="w-full accent-pass-400"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Visual QBER vs Distance Chart */}
        <div className="p-6 space-y-4 flex flex-col justify-between">
          <div>
            <span className="font-mono text-xs text-ink-400 uppercase tracking-wider block mb-2">
              Error Rate (QBER) vs. Fiber Distance:
            </span>

            {/* SVG Chart */}
            <div className="rounded-xl border border-abyss-700/60 bg-black/30 p-3">
              <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
                {/* Horizontal Safe limit line at 11% */}
                <line
                  x1={px}
                  y1={thresholdY}
                  x2={w - pr}
                  y2={thresholdY}
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
                <text x={w - pr} y={thresholdY - 5} textAnchor="end" className="fill-eve-400 text-[9px] font-mono">
                  11% Hard Limit
                </text>

                {/* X-axis ticks */}
                {[0, 50, 100, 150, 200].filter(km => km <= maxPlotKm).map(km => (
                  <text key={km} x={toX(km)} y={h - 8} textAnchor="middle" className="fill-ink-500 text-[9px] font-mono">
                    {km} km
                  </text>
                ))}

                {/* QBER Curve */}
                <path d={qberPath} fill="none" stroke="#22d3ee" strokeWidth="2.5" />

                {/* Current Distance Indicator Needle */}
                <line
                  x1={toX(distanceKm)}
                  y1={pt}
                  x2={toX(distanceKm)}
                  y2={h - pb}
                  stroke="#4ade80"
                  strokeWidth="1.5"
                  strokeDasharray="3 2"
                />
                <circle cx={toX(distanceKm)} cy={toYQ(result.qber)} r="5" fill="#4ade80" stroke="white" strokeWidth="1.5" />
              </svg>
            </div>
          </div>

          <div className="rounded-xl border border-abyss-700/60 bg-black/20 p-4">
            <span className="font-mono text-xs text-ink-300 font-semibold block mb-1">
              Why Can&apos;t We Use Fiber Amplifiers?
            </span>
            <p className="text-xs text-ink-400 leading-relaxed">
              Standard internet cables use erbium-doped fiber amplifiers (EDFAs) every 80 km to boost signals. But the <strong>Quantum No-Cloning Theorem</strong> proves that unknown quantum states cannot be duplicated. Any amplifier would measure and scramble the qubits, destroying the key!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
