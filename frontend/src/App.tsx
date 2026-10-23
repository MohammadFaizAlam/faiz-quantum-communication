import { useCallback, useEffect, useRef, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { WifiOff, Loader2, FlaskConical, Sparkles } from 'lucide-react'
import { ApiError, simulate } from './api'
import type { SimulateRequest, SimulateResult } from './types'
import { Header } from './components/Header'
import { ControlPanel, DEFAULT_CONFIG, validateConfig } from './components/ControlPanel'
import { ChannelDiagram } from './components/ChannelDiagram'
import { StatusBanner, ResultsSummary } from './components/ResultsSummary'
import { QberGauge, AttritionChart, QberTrials } from './components/Charts'
import { BasisTable } from './components/BasisTable'
import { ActivityLog, KeyInspector, EncryptionCard, RunMetadata } from './components/RunDetails'
import { PhotonAnimator } from './components/PhotonAnimator'
import { XorAnimation } from './components/XorAnimation'
import { ProtocolGuidePage } from './components/ProtocolExplainer'
import { TelemetryTicker } from './components/TelemetryTicker'

type LoadState =
  | { phase: 'idle' }
  | { phase: 'running' }
  | { phase: 'error'; message: string }
  | { phase: 'done'; result: SimulateResult }

function WorkbenchPage() {
  const [config, setConfig] = useState<SimulateRequest>(DEFAULT_CONFIG)
  const [state, setState] = useState<LoadState>({ phase: 'idle' })
  const [showSecrets, setShowSecrets] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const seqRef = useRef(0)

  const run = useCallback(async (cfg: SimulateRequest) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const seq = ++seqRef.current

    setState({ phase: 'running' })
    try {
      const result = await simulate(cfg, controller.signal)
      if (seq !== seqRef.current) return
      setState({ phase: 'done', result })
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      if (seq !== seqRef.current) return
      const message =
        err instanceof ApiError
          ? err.message
          : 'Unexpected error while running the simulation.'
      setState({ phase: 'error', message })
    }
  }, [])

  useEffect(() => () => abortRef.current?.abort(), [])

  const errors = validateConfig(config)
  const result = state.phase === 'done' ? state.result : null

  return (
    <main className="mx-auto max-w-[1400px] px-3.5 sm:px-6 py-5 sm:py-8">
      {/* Bloomberg Live Quantum Telemetry Ticker */}
      <TelemetryTicker
        result={result}
        config={config}
        running={state.phase === 'running'}
      />

      {/* Hero band */}
      <div className="bg-blueprint glass-card mb-6 sm:mb-8 rounded-xl px-4.5 py-4 sm:px-7 sm:py-6 fade-in-up">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 size-5 text-signal-400 shrink-0" aria-hidden />
          <p className="max-w-3xl text-[13px] sm:text-[13.5px] leading-[1.7] sm:leading-[1.75] text-ink-300">
            Alice sends photons polarized in random bases; Bob measures in his own. A public
            basis comparison distills a shared secret key, and the physics of measurement
            disturbance exposes anyone who listened in. Configure a run, watch the protocol
            execute, and read the honest caveats — this is a{' '}
            <strong className="text-ink-100 font-semibold">software simulation of idealized polarization
            states</strong>, not quantum hardware.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:gap-8 lg:grid-cols-[400px_1fr]">
        {/* Left rail: controls */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <ControlPanel
            config={config}
            onChange={setConfig}
            onRun={() => run(config)}
            running={state.phase === 'running'}
            disabled={errors.length > 0}
          />
        </div>

        {/* Right: workbench results */}
        <div className="min-w-0 space-y-6">
          {state.phase === 'running' && (
            <div className="glass-card flex items-center gap-4 rounded-xl p-6 text-ink-300 animate-shimmer" role="status">
              <Loader2 className="size-5 animate-spin text-signal-400" aria-hidden />
              <div>
                <div className="text-sm font-semibold text-ink-200">Executing the protocol…</div>
                <div className="text-[12px] text-ink-500 mt-0.5">
                  preparing {config.n_photons} qubits, channelling, measuring, sifting,
                  estimating QBER.
                </div>
              </div>
            </div>
          )}

          {state.phase === 'error' && (
            <div className="rounded-xl border border-eve-500/40 bg-eve-500/[0.06] p-6" role="alert">
              <div className="flex items-start gap-3.5">
                <WifiOff className="mt-0.5 size-5 shrink-0 text-eve-400" aria-hidden />
                <div>
                  <h2 className="text-sm font-bold text-eve-400">Simulation request failed</h2>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-300">{state.message}</p>
                  <button
                    type="button"
                    onClick={() => run(config)}
                    className="mt-4 rounded-lg border border-eve-500/40 px-4 py-2 font-mono text-xs font-medium text-eve-400 transition-all hover:bg-eve-500/10 hover:border-eve-400"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          {state.phase === 'idle' && <IdleState />}

          {result && (
            <>
              <StatusBanner key={result.run_id} result={result} />
              <ResultsSummary result={result} />
              <PhotonAnimator photons={result.photons} eveEnabled={result.config.eve_enabled} />
              <div className="grid gap-6 xl:grid-cols-2">
                <QberGauge result={result} />
                <AttritionChart result={result} />
              </div>
              <ChannelDiagram photons={result.photons} eveEnabled={result.config.eve_enabled} />
              <div className="grid gap-6 xl:grid-cols-2">
                <ActivityLog result={result} />
                <div className="space-y-6">
                  <EncryptionCard result={result} />
                  <XorAnimation result={result} />
                  <KeyInspector result={result} />
                </div>
              </div>
              <BasisTable
                photons={result.photons}
                showSecrets={showSecrets}
                onToggleSecrets={setShowSecrets}
              />
              <QberTrials baseConfig={result.config} />
              <RunMetadata result={result} />
            </>
          )}
        </div>
      </div>
    </main>
  )
}

function IdleState() {
  return (
    <div className="glass-card rounded-xl p-12 text-center">
      <FlaskConical className="mx-auto size-10 text-ink-500 animate-float" aria-hidden />
      <h2 className="mt-4 text-base font-semibold text-ink-200">No experiment yet</h2>
      <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-ink-500">
        Configure the protocol on the left — try Eve at 100% interception first to watch the
        QBER climb past the threshold, then rerun with her disabled for a clean key.
      </p>
    </div>
  )
}

export default function App() {
  return (
    <div className="min-h-screen">
      <Header />

      <Routes>
        <Route path="/" element={<WorkbenchPage />} />
        <Route path="/protocol-guide" element={<ProtocolGuidePage />} />
      </Routes>

      <footer className="mt-10 border-t border-abyss-700/60 py-6">
        <p className="mx-auto max-w-[1400px] px-6 text-[11.5px] leading-relaxed text-ink-500">
          First-year Computer Engineering physics project · BB84 educational simulation ·
          Randomness from software sources (CSPRNG or seeded PRNG), not physical quantum
          random number generation · No real key material exists here; do not use this
          system for actual secrecy.
        </p>
      </footer>
    </div>
  )
}
