import type { ReactNode } from 'react'
import { useGame } from '../state/store'

/** Full-height bottom sheet used by every tab. */
export function Sheet({ title, emoji, children, onBack }: { title: string; emoji?: string; children: ReactNode; onBack?: () => void }) {
  const close = useGame((s) => s.openSheet)
  return (
    <div className="fixed inset-0 z-10 bg-surface text-fg flex flex-col anim-rise">
      <header className="safe-top bg-chrome text-chrome-fg px-3 pt-2 pb-3 flex items-center gap-2">
        <button onClick={onBack ?? (() => close(null))} className="text-2xl px-2 active:opacity-60">{onBack ? '‹' : '✕'}</button>
        <h2 className="font-extrabold text-lg flex-1">{emoji} {title}</h2>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-3 safe-bottom">{children}</div>
    </div>
  )
}

export function Row({ emoji, title, sub, right, onClick, disabled }: { emoji: string; title: string; sub?: ReactNode; right?: ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || !onClick}
      className="w-full flex items-center gap-3 bg-card rounded-2xl px-3 py-3 mb-2 text-start shadow-sm disabled:opacity-50 active:scale-[0.99] transition"
    >
      <span className="text-2xl w-8 text-center">{emoji}</span>
      <span className="flex-1 min-w-0">
        <span className="block font-semibold truncate">{title}</span>
        {sub && <span className="block text-xs opacity-70">{sub}</span>}
      </span>
      {right && <span className="text-sm font-semibold tabular-nums">{right}</span>}
    </button>
  )
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-4">
      <h3 className="text-xs uppercase tracking-widest opacity-60 mb-2 px-1">{title}</h3>
      {children}
    </section>
  )
}

export function Pill({ children, tone = 'ink' }: { children: ReactNode; tone?: 'ink' | 'good' | 'bad' }) {
  const cls = tone === 'good' ? 'bg-emerald-600 text-white' : tone === 'bad' ? 'bg-red-600 text-white' : 'bg-chrome text-chrome-fg'
  return <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{children}</span>
}
