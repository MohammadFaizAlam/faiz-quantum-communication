import {
  CheckCircle2,
  OctagonAlert,
  HelpCircle,
  ShieldCheck,
  ShieldX,
  KeyRound,
  FlaskConical,
  Lock,
  LockOpen,
} from 'lucide-react'
import type { SimulateResult } from '../types'
import { fmtPct, Metric, Panel, SectionTitle, StatusChip, AnimatedNumber } from './ui'

const STATUS_META = {
  PASS: {
    icon: CheckCircle2,
    chip: 'pass' as const,
    title: 'KEY ACCEPTED',
    blurb:
      'The estimated QBER is at or below the configured educational threshold. The retained bits become the shared key. This is evidence of consistency, not proof of secrecy.',
    cardBorder: 'border-pass-400/40',
    cardBg: 'from-pass-400/[0.1] via-abyss-900/90 to-abyss-950/95',
    iconColor: 'text-pass-400',
    glow: 'glow-pass',
  },
  ABORT: {
    icon: OctagonAlert,
    chip: 'abort' as const,
    title: 'PROTOCOL ABORTED',
    blurb:
      'The estimated QBER exceeds the configured threshold. Consistent with an intercept–resend eavesdropper or excessive channel noise. The key material is discarded; no ciphertext is produced.',
    cardBorder: 'border-eve-500/50',
    cardBg: 'from-eve-500/[0.12] via-abyss-900/90 to-abyss-950/95',
    iconColor: 'text-eve-400',
    glow: 'glow-abort',
  },
  INCONCLUSIVE: {
    icon: HelpCircle,
    chip: 'inconclusive' as const,
    title: 'INCONCLUSIVE',
    blurb:
      'The test sample or remaining key was too small to make a meaningful security statement. No key is accepted and no ciphertext is produced.',
    cardBorder: 'border-warn-400/50',
    cardBg: 'from-warn-400/[0.1] via-abyss-900/90 to-abyss-950/95',
    iconColor: 'text-warn-400',
    glow: 'glow-amber',
  },
} as const

export function StatusBanner({ result }: { result: SimulateResult }) {
  const meta = STATUS_META[result.decision.status]
  const Icon = meta.icon
  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-gradient-to-r p-4 sm:p-6 backdrop-blur-xl ${meta.cardBorder} ${meta.cardBg} ${meta.glow} fade-in-up`}
      role="status"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className={`grid size-10 sm:size-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-black/30 shadow-inner ${meta.iconColor}`}>
            <Icon className="size-5 sm:size-6" aria-hidden />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-ink-100">{meta.title}</h2>
              <StatusChip
                tone={meta.chip}
                icon={<Icon className="size-3" aria-hidden />}
                label={result.decision.status}
              />
              <span className="font-mono text-[11px] sm:text-xs text-ink-500">
                RUN #{result.run_id}
              </span>
            </div>
            <p className="mt-1.5 sm:mt-2 max-w-2xl text-[12.5px] sm:text-[13px] leading-relaxed text-ink-300">
              {result.decision.rationale}
            </p>
          </div>
        </div>
        <div className="w-full sm:w-auto flex sm:block items-center justify-between sm:text-right rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 sm:px-5 sm:py-3 sm:self-center shadow-inner">
          <div>
            <div className="font-mono text-[10px] sm:text-[10.5px] font-semibold tracking-[0.16em] text-ink-400 uppercase">
              Observed QBER
            </div>
            <div className="mt-0.5 font-mono text-[10.5px] sm:text-[11px] text-ink-500">
              threshold: {fmtPct(result.decision.threshold_configured)}
            </div>
          </div>
          <div className="tnum font-mono text-2xl sm:text-3xl font-bold tracking-tight text-ink-100">
            {result.decision.qber_observed != null ? (
              <AnimatedNumber
                value={result.decision.qber_observed * 100}
                decimals={1}
                suffix="%"
              />
            ) : (
              '—'
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ResultsSummary({ result }: { result: SimulateResult }) {
  const { decision, estimation, retained_key, encryption, config } = result
  const encTone = encryption?.permitted ? 'pass' : 'neutral'
  return (
    <Panel className="fade-in-up">
      <div className="p-4 sm:p-6">
        <SectionTitle
          tag="STAGE 9–10"
          eyebrow="decision & distillation"
          title="Security Verdict & Key Accounting"
          icon={<ShieldCheck className="size-4" aria-hidden />}
        />
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-xl border border-abyss-700/60 bg-abyss-850/60 p-3 sm:p-4 transition-all hover:border-signal-500/30 hover:bg-abyss-800/60">
            <Metric
              tag="STATE"
              label="Decision"
              value={
                <StatusChip
                  tone={decision.status === 'PASS' ? 'pass' : decision.status === 'ABORT' ? 'abort' : 'inconclusive'}
                  icon={
                    decision.status === 'PASS' ? (
                      <ShieldCheck className="size-3" aria-hidden />
                    ) : decision.status === 'ABORT' ? (
                      <ShieldX className="size-3" aria-hidden />
                    ) : (
                      <HelpCircle className="size-3" aria-hidden />
                    )
                  }
                  label={decision.status}
                />
              }
              sub={`threshold ${fmtPct(decision.threshold_configured)}`}
              mono={false}
            />
          </div>

          <div className="rounded-xl border border-abyss-700/60 bg-abyss-850/60 p-4 transition-all hover:border-signal-500/30 hover:bg-abyss-800/60">
            <Metric
              tag="CH_01"
              label="QBER (errors / tested)"
              value={
                decision.qber_observed != null ? (
                  <AnimatedNumber
                    value={decision.qber_observed * 100}
                    decimals={1}
                    suffix="%"
                  />
                ) : (
                  '—'
                )
              }
              sub={`${estimation.errors} / ${estimation.sample_size} test bits disagreed`}
            />
          </div>

          <div className="rounded-xl border border-abyss-700/60 bg-abyss-850/60 p-4 transition-all hover:border-signal-500/30 hover:bg-abyss-800/60">
            <Metric
              tag="SAMPLE"
              label="Test sample"
              value={<AnimatedNumber value={estimation.sample_size} />}
              sub={`of ${result.sifted_count} sifted bits (${fmtPct(config.sample_fraction, 0)} configured)`}
            />
          </div>

          <div className="rounded-xl border border-abyss-700/60 bg-abyss-850/60 p-4 transition-all hover:border-signal-500/30 hover:bg-abyss-800/60">
            <Metric
              tag="SIFTED"
              label="Sifted key"
              value={<AnimatedNumber value={result.sifted_count} />}
              sub={`from ${config.n_photons} photons`}
            />
          </div>

          <div className="rounded-xl border border-abyss-700/60 bg-abyss-850/60 p-4 transition-all hover:border-signal-500/30 hover:bg-abyss-800/60">
            <Metric
              tag="SECRET"
              label="Retained key"
              value={
                <span>
                  <AnimatedNumber value={retained_key.length_bits} /> b
                </span>
              }
              sub="after removing revealed test bits"
            />
          </div>

          <div className="rounded-xl border border-abyss-700/50 bg-abyss-850/40 p-4 transition-all hover:border-abyss-600/70">
            <Metric
              label="Encryption"
              value={
                <StatusChip
                  tone={encTone}
                  icon={
                    encryption?.permitted ? (
                      <Lock className="size-3" aria-hidden />
                    ) : (
                      <LockOpen className="size-3" aria-hidden />
                    )
                  }
                  label={encryption?.permitted ? 'PERMITTED' : 'BLOCKED'}
                />
              }
              sub={
                encryption?.permitted
                  ? `OTP · ${encryption.key_used_bits} bits used`
                  : encryption?.reason
                    ? encryption.reason
                    : 'no message supplied'
              }
              mono={false}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 border-t border-abyss-700/50 pt-5 text-[12px] leading-relaxed text-ink-400 md:grid-cols-2">
          <div className="flex items-start gap-3 rounded-lg border border-abyss-700/30 bg-abyss-850/30 p-3">
            <KeyRound className="mt-0.5 size-4 text-signal-400 shrink-0" aria-hidden />
            <p>
              <strong className="text-ink-200">Theoretical reference:</strong> the familiar
              ~{fmtPct(decision.theoretical_reference, 0)} figure is the maximum tolerable QBER
              under idealized asymptotic security proofs. It is shown for context and is not a
              universal tripwire.
            </p>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-abyss-700/30 bg-abyss-850/30 p-3">
            <FlaskConical className="mt-0.5 size-4 text-signal-400 shrink-0" aria-hidden />
            <p>
              <strong className="text-ink-200">A low QBER is not proof of safety:</strong> with a
              partial interception rate below roughly 2× the threshold, Eve can stay under it.
              Detection here is statistical, and this run has no finite-key security proof.
            </p>
          </div>
        </div>
      </div>
    </Panel>
  )
}
