import { useState } from 'react'
import { Atom, BookOpen, Home, FlaskConical, Menu, X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export function Header() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    {
      path: '/',
      label: 'Workbench',
      shortLabel: 'Bench',
      icon: Home,
      exact: true,
    },
    {
      path: '/quantum-lab',
      label: 'Quantum Lab',
      shortLabel: 'Lab',
      icon: FlaskConical,
      accent: 'signal',
    },
    {
      path: '/protocol-guide',
      label: 'Protocol Guide',
      shortLabel: 'Guide',
      icon: BookOpen,
      accent: 'amber',
    },
  ]

  const isActive = (path: string, exact?: boolean) => {
    return exact ? location.pathname === path : location.pathname.startsWith(path)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-abyss-700/60 bg-abyss-950/90 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-2.5 px-3.5 py-2 sm:px-6 sm:py-2.5">
        {/* Brand Link */}
        <Link
          to="/"
          className="flex items-center gap-2 sm:gap-2.5 group min-w-0 shrink"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="relative grid size-8 sm:size-9 shrink-0 place-items-center rounded-xl border border-signal-500/30 bg-gradient-to-br from-signal-500/20 via-abyss-900 to-abyss-950 transition-all duration-300 group-hover:border-signal-400/60 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.25)]">
            <Atom className="size-4.5 sm:size-5 text-signal-400 transition-transform duration-500 group-hover:rotate-90" aria-hidden />
            <div className="absolute inset-0 rounded-xl bg-signal-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[13px] sm:text-[14.5px] leading-tight font-bold tracking-tight text-ink-100 group-hover:text-white transition-colors truncate">
                Quantum Security
              </span>
              <span className="hidden md:inline-flex items-center font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-amber-400">
                BB84
              </span>
            </div>
            <p className="font-mono text-[8.5px] sm:text-[9.5px] leading-tight tracking-[0.12em] sm:tracking-[0.15em] text-ink-500 uppercase truncate mt-0.5">
              QKD PROTOCOL <span className="hidden xl:inline">· PHYSICAL LAB &amp; SURVEILLANCE</span>
            </p>
          </div>
        </Link>

        {/* Desktop / Tablet Navigation */}
        <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1.5 lg:gap-2">
          {navItems.map(item => {
            const Icon = item.icon
            const active = isActive(item.path, item.exact)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 lg:px-3 lg:py-1.5 text-[11.5px] lg:text-[12px] font-mono font-semibold transition-all duration-200 whitespace-nowrap ${
                  active
                    ? 'border border-signal-500/40 bg-signal-500/15 text-signal-200 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'border border-abyss-700/60 bg-abyss-900/60 text-ink-300 hover:border-abyss-600 hover:text-ink-100 hover:bg-abyss-800/60'
                }`}
              >
                <Icon
                  className={`size-3.5 ${
                    active
                      ? 'text-signal-300'
                      : item.accent === 'amber'
                      ? 'text-amber-400'
                      : 'text-ink-400'
                  }`}
                  aria-hidden
                />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Mobile Navigation Toggle */}
        <div className="flex md:hidden items-center gap-1.5">
          {/* Quick link to active / alternate */}
          <Link
            to={location.pathname === '/quantum-lab' ? '/' : '/quantum-lab'}
            className="inline-flex items-center gap-1 rounded-lg border border-signal-500/30 bg-signal-500/10 px-2.5 py-1.5 text-[11px] font-mono font-semibold text-signal-300"
          >
            {location.pathname === '/quantum-lab' ? (
              <>
                <Home className="size-3" />
                <span>Bench</span>
              </>
            ) : (
              <>
                <FlaskConical className="size-3 text-signal-400" />
                <span>Lab</span>
              </>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="grid size-8.5 place-items-center rounded-lg border border-abyss-700 bg-abyss-900 text-ink-300 hover:text-white hover:border-abyss-600 transition-colors"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="size-4.5" /> : <Menu className="size-4.5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-abyss-700/60 bg-abyss-950/98 px-4 py-3 backdrop-blur-2xl shadow-2xl animate-fade-in">
          <div className="space-y-1.5">
            {navItems.map(item => {
              const Icon = item.icon
              const active = isActive(item.path, item.exact)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-lg px-3.5 py-2.5 text-xs font-mono font-semibold transition-all ${
                    active
                      ? 'border border-signal-500/40 bg-signal-500/20 text-signal-200'
                      : 'border border-abyss-800 bg-abyss-900/40 text-ink-300 hover:bg-abyss-850'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`size-4 ${active ? 'text-signal-300' : 'text-ink-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {active && (
                    <span className="size-1.5 rounded-full bg-signal-400 animate-pulse" />
                  )}
                </Link>
              )
            })}
          </div>

          <div className="mt-3 pt-2.5 border-t border-abyss-800/80 flex items-center justify-between text-[10px] font-mono text-ink-500">
            <span>BB84 QKD Engine</span>
            <span>Bennett &amp; Brassard (1984)</span>
          </div>
        </div>
      )}
    </header>
  )
}
