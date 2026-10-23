import { useState } from 'react'
import { Copy, Check, Terminal, TriangleAlert, XCircle, CheckCircle2, Info, Lock, KeyRound, Settings2 } from 'lucide-react'
import type { SimulateResult } from '../types'
import { fmtPct, Panel, SectionTitle } from './ui'

const LEVEL_META = {
  info: { icon: Info, cls: 'text-signal-400 bg-signal-500/10 border-signal-500/20' },
  warn: { icon: TriangleAlert, cls: 'text-warn-400 bg-warn-400/10 border-warn-400/20' },
  error: { icon: XCircle, cls: 'text-eve-400 bg-eve-500/10 border-eve-500/20' },
  success: { icon: CheckCircle2, cls: 'text-pass-400 bg-pass-400/10 border-pass-400/20' },
} as const

/** Ordered protocol log, rendered from the backend's actual run record. */
export function ActivityLog({ result }: { result: SimulateResult }) {
  return (
    <Panel className="fade-in-up">
      <div className="p-4 sm:p-6">
        <SectionTitle
          eyebrow="execution trace"
          title="Protocol Activity Log"
          icon={<Terminal className="size-4" aria-hidden />}
        />
        <ol className="space-y-4">
          {result.logs.map((entry, i) => {
            const meta = LEVEL_META[entry.level] ?? LEVEL_META.info
            const Icon = meta.icon
            return (
              <li key={i} className="flex gap-3.5">
                <div className="flex flex-col items-center pt-0.5">
                  <div className={`grid size-6 place-items-center rounded-md border ${meta.cls}`}>
                    <Icon className="size-3 shrink-0" aria-hidden />
                  </div>
                  {i < result.logs.length - 1 && (
                    <div className="mt-1.5 w-px flex-1 bg-abyss-700/60" />
                  )}
                </div>
                <div className="min-w-0 pb-2">
                  <div className="font-mono text-[10.5px] font-semibold tracking-[0.16em] text-signal-400/70 uppercase">
                    Stage {String(i + 1).padStart(2, '0')} · {entry.stage}
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-200">
                    {entry.message}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </Panel>
  )
}

/** Optional key inspector: hidden by default, with an explicit secrecy warning. */
export function KeyInspector({ result }: { result: SimulateResult }) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const bits = result.retained_key.details

  async function copyKey() {
    if (!revealed) return
    const text = bits.map((b) => b.bob_bit).join('')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <Panel className="fade-in-up">
      <div className="p-4 sm:p-6">
        <SectionTitle
          eyebrow="secrecy inspection"
          title="Retained Key Material"
          icon={<KeyRound className="size-4" aria-hidden />}
        >
          <span className="tnum font-mono text-xs font-semibold px-2 py-0.5 rounded bg-pass-400/10 border border-pass-400/30 text-pass-400">
            {result.retained_key.length_bits} bits
          </span>
        </SectionTitle>

        {bits.length === 0 ? (
          <p className="text-[13px] leading-relaxed text-ink-400">
            No key material was retained in this run (the protocol aborted or test revealed all bits).
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setRevealed(!revealed)}
                aria-pressed={revealed}
                className={`rounded-lg border px-3.5 py-1.5 font-mono text-[11.5px] font-semibold transition-all ${
                  revealed
                    ? 'border-warn-400/50 bg-warn-400/15 text-warn-400 shadow-[0_0_10px_rgba(251,191,36,0.15)]'
                    : 'border-abyss-600 bg-abyss-800/60 text-ink-300 hover:border-signal-500/50 hover:text-signal-300'
                }`}
              >
                {revealed ? 'Hide Secret Bits' : 'Reveal Secret Bits'}
              </button>
              {revealed && (
                <button
                  type="button"
                  onClick={copyKey}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-abyss-600 bg-abyss-800/60 px-3.5 py-1.5 font-mono text-[11.5px] font-semibold text-ink-300 transition-all hover:border-signal-500/50 hover:text-signal-300"
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5 text-pass-400" aria-hidden /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" aria-hidden /> Copy Bits
                    </>
                  )}
                </button>
              )}
            </div>
            {revealed && (
              <div className="mt-4 space-y-3">
                <div
                  role="alert"
                  className="rounded-lg border border-warn-400/40 bg-warn-400/10 p-3 text-[12px] text-warn-300 leading-relaxed"
                >
                  Notice: In a real QKD link, these bits must remain strictly confidential in secure storage.
                </div>
                <div className="tnum max-h-44 overflow-y-auto rounded-xl border border-abyss-700/60 bg-abyss-950/80 p-4 font-mono text-xs leading-6 tracking-widest break-all text-pass-400 shadow-inner">
                  {bits.map((b) => b.bob_bit).join(' ')}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Panel>
  )
}

/** One-time-pad demonstration result, only present when permitted. */
export function EncryptionCard({ result }: { result: SimulateResult }) {
  const enc = result.encryption
  if (!enc) return null

  return (
    <Panel className="fade-in-up">
      <div className="p-4 sm:p-6">
        <SectionTitle
          eyebrow="application layer"
          title="One-Time-Pad (OTP) Demonstration"
          icon={<Lock className="size-4" aria-hidden />}
        />
        {enc.permitted ? (
          <div className="space-y-4">
            <div className="grid gap-3 rounded-xl border border-abyss-700/50 bg-abyss-850/40 p-4 text-[12.5px] leading-relaxed text-ink-300 sm:grid-cols-3">
              <div>
                <div className="font-mono text-[10.5px] font-semibold tracking-[0.16em] text-ink-500 uppercase">Message</div>
                <div className="mt-1 font-mono text-sm font-bold text-ink-100">
                  “{result.config.message}”
                </div>
              </div>
              <div>
                <div className="font-mono text-[10.5px] font-semibold tracking-[0.16em] text-ink-500 uppercase">Key Consumed</div>
                <div className="tnum mt-1 font-mono text-sm font-semibold text-ink-100">
                  {enc.key_used_bits} bits <span className="text-ink-500">({enc.remaining_key_bits} left)</span>
                </div>
              </div>
              <div>
                <div className="font-mono text-[10.5px] font-semibold tracking-[0.16em] text-ink-500 uppercase">Verification</div>
                <div className="mt-1 font-mono text-sm">
                  {enc.decrypted_message === result.config.message ? (
                    <span className="font-bold text-pass-400">Decryption Matches ✓</span>
                  ) : (
                    <span className="font-bold text-eve-400">Mismatch ✗</span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="font-mono text-[10.5px] font-semibold tracking-[0.16em] text-ink-500 uppercase mb-1.5">
                Ciphertext (Hexadecimal)
              </div>
              <div className="tnum max-h-24 overflow-y-auto rounded-xl border border-abyss-700/60 bg-abyss-950/80 p-3.5 font-mono text-xs break-all text-signal-300 shadow-inner">
                {enc.cipher_hex}
              </div>
            </div>

            <p className="text-[12px] leading-relaxed text-ink-400">
              BB84 establishes the shared key material; the One-Time-Pad performs the mathematical encryption (Message ⊕ Key). OTP guarantees information-theoretic secrecy because the key is random, equal in length, and never reused.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-abyss-700/50 bg-abyss-850/40 p-4 text-[12.5px] leading-relaxed text-ink-400">
            {enc.reason ?? 'Encryption was not performed for this run.'} No ciphertext is fabricated when the protocol aborts or the key is insufficient.
          </div>
        )}
      </div>
    </Panel>
  )
}

/** Configuration provenance + randomness disclosure + run warnings. */
export function RunMetadata({ result }: { result: SimulateResult }) {
  const c = result.config
  return (
    <Panel className="fade-in-up">
      <div className="p-4 sm:p-6">
        <SectionTitle
          eyebrow="provenance & audit"
          title="Run Metadata & Parameters"
          icon={<Settings2 className="size-4" aria-hidden />}
        />
        <div className="grid grid-cols-2 gap-3 font-mono text-xs sm:grid-cols-4">
          {[
            ['Photons', c.n_photons],
            ['Eve Status', c.eve_enabled ? `On (${fmtPct(c.interception_rate, 0)} intercept)` : 'Off'],
            ['Channel Noise', fmtPct(c.noise_rate, 1)],
            ['Test Sample', fmtPct(c.sample_fraction, 0)],
            ['Abort Threshold', fmtPct(c.threshold)],
            ['Deterministic Seed', c.seed ?? 'None (CSPRNG)'],
            ['Message Provided', c.message ? 'Yes' : 'None'],
            ['Run ID', result.run_id],
          ].map(([k, v]) => (
            <div key={String(k)} className="rounded-lg border border-abyss-700/40 bg-abyss-850/40 p-3">
              <span className="block text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold mb-1">{k}</span>
              <span className="font-semibold text-ink-200">{String(v)}</span>
            </div>
          ))}
        </div>

        <p className="mt-4 border-t border-abyss-700/50 pt-3 text-[11.5px] text-ink-400">
          Randomness source: <strong className="text-ink-200 font-mono">{result.randomness.source}</strong>
        </p>

        {result.warnings.length > 0 && (
          <ul className="mt-3 space-y-2">
            {result.warnings.map((w, i) => (
              <li key={i} className="flex items-start gap-2.5 rounded-lg border border-warn-400/25 bg-warn-400/10 p-2.5 text-[12px] text-warn-300">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-warn-400" aria-hidden />
                {w}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  )
}
