import { Atom, BookOpen, Home } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export function Header() {
  const location = useLocation()
  const isGuide = location.pathname === '/protocol-guide'

  return (
    <header className="sticky top-0 z-50 border-b border-abyss-700/60 bg-abyss-950/90 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-2 sm:px-6 sm:py-2.5">
        <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group min-w-0">
          <div className="relative grid size-9 sm:size-9.5 shrink-0 place-items-center rounded-xl border border-signal-500/30 bg-gradient-to-br from-signal-500/20 via-abyss-900 to-abyss-950 transition-all duration-300 group-hover:border-signal-400/60 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.25)]">
            <Atom className="size-5 text-signal-400 transition-transform duration-500 group-hover:rotate-90" aria-hidden />
            <div className="absolute inset-0 rounded-xl bg-signal-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-[13.5px] sm:text-[15px] leading-tight font-bold tracking-tight text-ink-100 group-hover:text-white transition-colors truncate">
                Quantum Secure Communication
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-amber-400">
                TERMINAL
              </span>
            </div>
            <p className="font-mono text-[9px] sm:text-[10px] leading-tight tracking-[0.15em] sm:tracking-[0.18em] text-ink-500 uppercase truncate mt-0.5">
              BB84 PROTOCOL<span className="hidden sm:inline"> · INTRUSION SURVEILLANCE</span>
            </p>
          </div>
        </Link>

        <nav aria-label="Main navigation" className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden lg:flex items-center gap-2 font-mono text-[10px] text-ink-400 bg-black/30 border border-abyss-700/60 px-2.5 py-1 rounded-md">
            <span className="size-1.5 rounded-full bg-pass-400 animate-pulse" />
            <span className="text-ink-500">REF:</span>
            <span className="text-ink-200 font-semibold">BENNETT &amp; BRASSARD (1984)</span>
          </div>

          <div className="hidden lg:block w-px h-5 bg-abyss-700" />

          {isGuide ? (
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg border border-signal-500/30 bg-signal-500/10 px-2.5 py-1.5 sm:px-3 sm:py-1.5 text-[11.5px] sm:text-[12px] font-mono font-semibold text-signal-300 transition-all duration-200 hover:border-signal-400/60 hover:bg-signal-500/20 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] whitespace-nowrap"
            >
              <Home className="size-3.5" aria-hidden />
              <span>[ WORKBENCH ]</span>
            </Link>
          ) : (
            <Link
              to="/protocol-guide"
              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg border border-abyss-600 bg-abyss-850/60 px-2.5 py-1.5 sm:px-3 sm:py-1.5 text-[11.5px] sm:text-[12px] font-mono font-semibold text-ink-300 transition-all duration-200 hover:border-amber-500/40 hover:text-amber-300 hover:bg-amber-500/10 hover:shadow-[0_0_15px_rgba(245,158,11,0.12)] whitespace-nowrap"
            >
              <BookOpen className="size-3.5 text-amber-400" aria-hidden />
              <span>PROTOCOL GUIDE</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
