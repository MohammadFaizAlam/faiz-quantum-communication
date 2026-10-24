import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  Layers,
  Radio,
  Lock,
  Activity,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react'
import { PoincareSphereInstrument } from './PoincareSphereInstrument'
import { BornMeasurementLab } from './BornMeasurementLab'
import { WeakPulsePoissonLab } from './WeakPulsePoissonLab'
import { OpticalFiberChannelLab } from './OpticalFiberChannelLab'
import { InformationTheoryLab } from './InformationTheoryLab'

type TabKey = 'poincare' | 'born' | 'poisson' | 'fiber' | 'security'

interface Station {
  key: TabKey
  number: string
  title: string
  tagline: string
  icon: typeof Sparkles
  color: string
}

const STATIONS: Station[] = [
  {
    key: 'poincare',
    number: '01',
    title: 'Photon Polarization',
    tagline: 'How qubits are encoded in light',
    icon: Sparkles,
    color: 'text-signal-400',
  },
  {
    key: 'born',
    number: '02',
    title: 'Quantum Measurement',
    tagline: 'Why observing a photon disturbs it',
    icon: Layers,
    color: 'text-alice-400',
  },
  {
    key: 'poisson',
    number: '03',
    title: 'Laser Pulse Security',
    tagline: 'Why true single photons are needed',
    icon: Radio,
    color: 'text-amber-400',
  },
  {
    key: 'fiber',
    number: '04',
    title: 'Fiber & Distance Limits',
    tagline: 'How far quantum keys can travel',
    icon: Activity,
    color: 'text-pass-400',
  },
  {
    key: 'security',
    number: '05',
    title: 'Secret Key Distillation',
    tagline: 'The 11% error threshold for secrecy',
    icon: Lock,
    color: 'text-signal-400',
  },
]

export function QuantumLabPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('poincare')
  const currentIndex = STATIONS.findIndex(s => s.key === activeTab)

  const goToNext = () => {
    if (currentIndex < STATIONS.length - 1) {
      setActiveTab(STATIONS[currentIndex + 1].key)
      window.scrollTo({ top: 180, behavior: 'smooth' })
    }
  }

  const goToPrev = () => {
    if (currentIndex > 0) {
      setActiveTab(STATIONS[currentIndex - 1].key)
      window.scrollTo({ top: 180, behavior: 'smooth' })
    }
  }

  return (
    <main className="mx-auto max-w-[1240px] px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header Banner - Streamlined & Friendly */}
      <div className="bg-blueprint glass-card rounded-2xl p-5 sm:p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-signal-500/15 border border-signal-500/30 text-signal-300 font-mono text-[10.5px] font-semibold">
                Interactive Physics Lab
              </span>
              <span className="text-ink-500 text-xs hidden sm:inline">·</span>
              <span className="text-ink-400 text-xs hidden sm:inline">5 Core Principles</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink-100">
              The Physics Under the Hood
            </h1>
            <p className="text-[13px] sm:text-[13.5px] text-ink-300 leading-relaxed">
              Explore the fundamental quantum laws and optical principles that make BB84 secure. Step through each station below to see how polarization, measurement collapse, and error thresholds work in real time.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-abyss-600 bg-abyss-850/60 px-3 py-2 font-mono text-xs font-semibold text-ink-300 hover:text-white hover:border-signal-500/40 transition-all"
            >
              <span>Back to Workbench</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Station Selector - Clean Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 [&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1">
        {STATIONS.map((station, idx) => {
          const Icon = station.icon
          const isActive = activeTab === station.key
          return (
            <button
              key={station.key}
              onClick={() => setActiveTab(station.key)}
              className={`text-left rounded-xl p-3 border transition-all duration-200 relative ${
                isActive
                  ? 'bg-signal-500/15 border-signal-500/60 shadow-[0_0_20px_rgba(6,182,212,0.15)] text-ink-100'
                  : 'bg-abyss-900/60 border-abyss-700/60 hover:border-abyss-500 text-ink-400 hover:text-ink-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`font-mono text-[10px] font-bold ${isActive ? 'text-signal-300' : 'text-ink-500'}`}>
                  0{idx + 1}
                </span>
                <Icon className={`size-3.5 ${isActive ? station.color : 'text-ink-500'}`} />
              </div>
              <div className="font-bold text-xs leading-snug truncate">{station.title}</div>
              <div className="text-[10px] text-ink-500 leading-tight truncate mt-0.5 hidden lg:block">
                {station.tagline}
              </div>
            </button>
          )
        })}
      </div>

      {/* Active Station View */}
      <div className="transition-all duration-300">
        {activeTab === 'poincare' && <PoincareSphereInstrument />}
        {activeTab === 'born' && <BornMeasurementLab />}
        {activeTab === 'poisson' && <WeakPulsePoissonLab />}
        {activeTab === 'fiber' && <OpticalFiberChannelLab />}
        {activeTab === 'security' && <InformationTheoryLab />}
      </div>

      {/* Mobile-Friendly Walkthrough Navigation (Prev / Next) */}
      <div className="pt-4 border-t border-abyss-700/60 space-y-3">
        {/* Progress Header */}
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-ink-500">Station Progress:</span>
            <div className="flex items-center gap-1.5">
              {STATIONS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveTab(STATIONS[i].key)
                    window.scrollTo({ top: 120, behavior: 'smooth' })
                  }}
                  className={`size-2 sm:size-2.5 rounded-full transition-all ${
                    i === currentIndex
                      ? 'bg-signal-400 w-5 sm:w-6'
                      : i < currentIndex
                      ? 'bg-signal-500/40'
                      : 'bg-abyss-700'
                  }`}
                  aria-label={`Go to Station ${i + 1}`}
                />
              ))}
            </div>
          </div>
          <span className="text-ink-400 text-[11px] sm:text-xs">
            <strong className="text-signal-300">0{currentIndex + 1}</strong> / 0{STATIONS.length}
          </span>
        </div>

        {/* Action Buttons: 2-Column Touch Grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          <button
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className="flex items-center justify-center gap-2 rounded-xl border border-abyss-700 bg-abyss-900/80 px-4 py-3 font-mono text-xs font-semibold text-ink-300 hover:text-white hover:border-abyss-500 active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none transition-all min-h-[46px]"
          >
            <ArrowLeft className="size-4 shrink-0" />
            <span className="truncate">Previous<span className="hidden sm:inline"> Station</span></span>
          </button>

          <button
            onClick={goToNext}
            disabled={currentIndex === STATIONS.length - 1}
            className="flex items-center justify-center gap-2 rounded-xl border border-signal-500/40 bg-signal-500/15 px-4 py-3 font-mono text-xs font-bold text-signal-300 hover:bg-signal-500/25 hover:border-signal-400 active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none transition-all shadow-[0_0_15px_rgba(6,182,212,0.1)] min-h-[46px]"
          >
            <span className="truncate">Next<span className="hidden sm:inline"> Station</span></span>
            <ChevronRight className="size-4 shrink-0" />
          </button>
        </div>
      </div>

      {/* Protocol Guide Callout Card - Mobile Optimized */}
      <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.04] p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-3">
          <div className="grid size-8 sm:size-9 place-items-center rounded-lg bg-amber-500/10 border border-amber-500/20 shrink-0 mt-0.5 sm:mt-0">
            <BookOpen className="size-4 text-amber-400" />
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-[13px] font-bold text-ink-100">
              Ready to see all 5 principles in action?
            </div>
            <p className="text-[11px] sm:text-xs text-ink-400 mt-0.5 leading-relaxed">
              Read our step-by-step interactive guide on how Alice and Bob exchange quantum keys.
            </p>
          </div>
        </div>

        <Link
          to="/protocol-guide"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3.5 py-2.5 font-mono text-xs font-bold text-amber-300 hover:bg-amber-500/25 hover:border-amber-400 active:scale-[0.98] transition-all whitespace-nowrap min-h-[42px] sm:min-h-0 shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.1)]"
        >
          <span>Protocol Guide</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </main>
  )
}

export default QuantumLabPage
