import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Eye, EyeOff, Download, Table2, ShieldAlert } from 'lucide-react'
import type { PhotonRow } from '../types'
import { Panel, SectionTitle } from './ui'

type Filter = 'all' | 'sifted' | 'tested' | 'retained' | 'eve' | 'discarded'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'sifted', label: 'Sifted' },
  { id: 'tested', label: 'Test Bits' },
  { id: 'retained', label: 'Retained Key' },
  { id: 'eve', label: 'Eve Intercepted' },
  { id: 'discarded', label: 'Discarded' },
]

const PAGE_SIZE = 25

export function BasisTable({
  photons,
  showSecrets,
  onToggleSecrets,
}: {
  photons: PhotonRow[]
  showSecrets: boolean
  onToggleSecrets: (v: boolean) => void
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const [page, setPage] = useState(0)

  const counts = useMemo(() => ({
    all: photons.length,
    sifted: photons.filter((p) => p.sifted).length,
    tested: photons.filter((p) => p.tested).length,
    retained: photons.filter((p) => p.retained).length,
    eve: photons.filter((p) => p.eve_intercepted).length,
    discarded: photons.filter((p) => !p.sifted).length,
  }), [photons])

  const rows = useMemo(() => {
    switch (filter) {
      case 'sifted':
        return photons.filter((p) => p.sifted)
      case 'tested':
        return photons.filter((p) => p.tested)
      case 'retained':
        return photons.filter((p) => p.retained)
      case 'eve':
        return photons.filter((p) => p.eve_intercepted)
      case 'discarded':
        return photons.filter((p) => !p.sifted)
      default:
        return photons
    }
  }, [photons, filter])

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pageRows = rows.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  function exportCsv() {
    const header =
      'index,alice_bit,alice_basis,state_sent,eve_intercepted,eve_basis,bob_basis,bob_result,basis_match,sifted,tested,retained'
    const lines = photons.map((p) =>
      [
        p.index,
        showSecrets ? p.alice_bit : '',
        p.alice_basis,
        `"${p.alice_state}"`,
        p.eve_intercepted,
        p.eve_basis ?? '',
        p.bob_basis,
        showSecrets ? p.bob_result : '',
        p.basis_match,
        p.sifted,
        p.tested,
        p.retained,
      ].join(','),
    )
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bb84-photons.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Panel className="fade-in-up">
      <div className="p-4 sm:p-6 pb-0">
        <SectionTitle
          eyebrow="raw quantum ledger"
          title="Photon Ledger & Basis Alignment"
          icon={<Table2 className="size-4" aria-hidden />}
        >
          <button
            type="button"
            onClick={() => onToggleSecrets(!showSecrets)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-[11px] font-semibold transition-all duration-200 ${
              showSecrets
                ? 'border-warn-400/50 bg-warn-400/15 text-warn-400 shadow-[0_0_12px_rgba(251,191,36,0.15)]'
                : 'border-abyss-600 bg-abyss-800/60 text-ink-300 hover:border-signal-500/50 hover:text-signal-300'
            }`}
            aria-pressed={showSecrets}
          >
            {showSecrets ? <EyeOff className="size-3.5" aria-hidden /> : <Eye className="size-3.5" aria-hidden />}
            {showSecrets ? 'Secrets Revealed' : 'Secrets Masked'}
          </button>
        </SectionTitle>

        {showSecrets && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-xl border border-warn-400/40 bg-warn-400/[0.08] p-3.5 text-[12.5px] text-warn-300 leading-relaxed"
          >
            <ShieldAlert className="mt-0.5 size-4 text-warn-400 shrink-0" aria-hidden />
            <p>
              <strong className="text-warn-200 font-semibold">Viva Demonstration Mode:</strong> Secret bits are currently shown for educational inspection. In a physical quantum deployment, revealing these unannounced bits would permanently destroy the secrecy of the distilled key.
            </p>
          </div>
        )}

        {/* Filter pills & export button */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {FILTERS.map((f) => {
              const count = counts[f.id]
              const active = filter === f.id
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setFilter(f.id)
                    setPage(0)
                  }}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-[11px] font-semibold transition-all duration-200 ${
                    active
                      ? 'border-signal-500/60 bg-signal-500/15 text-signal-300 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                      : 'border-abyss-700 bg-abyss-850/60 text-ink-400 hover:border-abyss-600 hover:text-ink-200'
                  }`}
                >
                  <span>{f.label}</span>
                  <span className={`rounded px-1.5 py-0.2 text-[10px] ${
                    active ? 'bg-signal-400/20 text-signal-200' : 'bg-abyss-800 text-ink-500'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-abyss-600 bg-abyss-800/60 px-3 py-1.5 font-mono text-[11px] font-semibold text-ink-300 transition-all hover:border-signal-500/50 hover:text-signal-300"
          >
            <Download className="size-3.5" aria-hidden />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table container */}
      <div className="overflow-x-auto px-4 sm:px-6 pb-2 scrollbar-thin">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-abyss-700/60 bg-abyss-850/50 font-mono text-[10.5px] tracking-wider text-ink-400 uppercase">
              <th className="py-2.5 px-3 font-semibold">#</th>
              <th className="py-2.5 px-3 font-semibold">Alice Bit</th>
              <th className="py-2.5 px-3 font-semibold">Alice Basis</th>
              <th className="py-2.5 px-3 font-semibold">State Sent</th>
              <th className="py-2.5 px-3 font-semibold">Eve Action</th>
              <th className="py-2.5 px-3 font-semibold">Bob Basis</th>
              <th className="py-2.5 px-3 font-semibold">Bob Bit</th>
              <th className="py-2.5 px-3 font-semibold">Bases Match</th>
              <th className="py-2.5 px-3 font-semibold">Stage Verdict</th>
            </tr>
          </thead>
          <tbody className="font-mono text-xs divide-y divide-abyss-800/60">
            {pageRows.map((p) => {
              const error = p.basis_match && p.bob_result !== p.alice_bit

              return (
                <tr key={p.index} className="transition-colors hover:bg-abyss-800/30">
                  <td className="tnum py-2 px-3 text-ink-500 font-semibold">{p.index}</td>
                  <td className="py-2 px-3">
                    {showSecrets ? (
                      <span className="tnum font-bold text-alice-400">{p.alice_bit}</span>
                    ) : (
                      <span className="text-ink-600">■</span>
                    )}
                  </td>
                  <td className="py-2 px-3 font-bold text-alice-400">
                    <span className="inline-grid size-5.5 place-items-center rounded bg-alice-500/10 border border-alice-500/20">
                      {p.alice_basis === '+' ? '+' : '×'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-signal-300 font-semibold" title={p.alice_state}>
                    {p.alice_state.split(' ')[0]}
                  </td>
                  <td className="py-2 px-3">
                    {p.eve_intercepted ? (
                      <span className="inline-flex items-center gap-1 text-eve-400 font-semibold">
                        {p.eve_basis === '+' ? '+' : '×'}→{showSecrets ? p.eve_result : '■'}
                      </span>
                    ) : (
                      <span className="text-ink-600">—</span>
                    )}
                  </td>
                  <td className="py-2 px-3 font-bold text-bob-400">
                    <span className="inline-grid size-5.5 place-items-center rounded bg-bob-500/10 border border-bob-500/20">
                      {p.bob_basis === '+' ? '+' : '×'}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    {showSecrets ? (
                      <span className={`tnum font-bold ${error ? 'text-eve-400 bg-eve-500/15 px-1 py-0.5 rounded' : 'text-bob-400'}`}>
                        {p.bob_result}
                      </span>
                    ) : (
                      <span className="text-ink-600">■</span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {p.basis_match ? (
                      <span className="inline-block rounded-md bg-pass-400/10 border border-pass-400/25 px-2 py-0.5 text-[10.5px] font-semibold text-pass-400">
                        Match
                      </span>
                    ) : (
                      <span className="inline-block rounded-md bg-abyss-800 border border-abyss-700 px-2 py-0.5 text-[10.5px] text-ink-500">
                        Mismatch
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {p.tested ? (
                      <span className="inline-block rounded-md bg-warn-400/10 border border-warn-400/25 px-2 py-0.5 text-[10.5px] font-semibold text-warn-400">
                        Revealed in Test
                      </span>
                    ) : p.retained ? (
                      <span className="inline-block rounded-md bg-pass-400/15 border border-pass-400/30 px-2 py-0.5 text-[10.5px] font-bold text-pass-400">
                        Retained Key
                      </span>
                    ) : p.sifted ? (
                      <span className="inline-block rounded-md bg-abyss-800 border border-abyss-700 px-2 py-0.5 text-[10.5px] text-ink-400">
                        Sifted
                      </span>
                    ) : (
                      <span className="inline-block rounded-md bg-abyss-850 border border-abyss-750 px-2 py-0.5 text-[10.5px] text-ink-600">
                        Discarded
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-[13px] text-ink-500">
                  No photons match this filter in the current run.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-abyss-700/50 px-4 sm:px-6 py-3.5">
        <span className="tnum font-mono text-[11.5px] text-ink-400">
          Showing <strong className="text-ink-200">{rows.length}</strong> photon{rows.length === 1 ? '' : 's'} · Page <strong className="text-ink-200">{safePage + 1}</strong> of <strong className="text-ink-200">{pageCount}</strong>
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage(Math.max(0, safePage - 1))}
            disabled={safePage === 0}
            aria-label="Previous page"
            className="rounded-lg border border-abyss-600 bg-abyss-800/60 p-1.5 text-ink-400 transition-all hover:text-ink-100 disabled:opacity-30"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))}
            disabled={safePage >= pageCount - 1}
            aria-label="Next page"
            className="rounded-lg border border-abyss-600 bg-abyss-800/60 p-1.5 text-ink-400 transition-all hover:text-ink-100 disabled:opacity-30"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </Panel>
  )
}
