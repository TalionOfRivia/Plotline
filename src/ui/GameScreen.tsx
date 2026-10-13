import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useGame } from '../state/store'
import { StatBar } from './StatBar'
import { Diary } from './Diary'
import { EventModal } from './EventModal'
import { OutcomeSheet } from './OutcomeSheet'
import { formatMoney } from './money'

const STAT_COLORS = {
  happiness: 'var(--color-happy)',
  health: 'var(--color-health)',
  smarts: 'var(--color-smarts)',
  looks: 'var(--color-looks)',
} as const
const STAT_EMOJI = { happiness: '😊', health: '❤️', smarts: '🧠', looks: '✨' } as const

export function GameScreen() {
  const { t, i18n } = useTranslation()
  const life = useGame((s) => s.life)!
  const ageUp = useGame((s) => s.ageUp)
  const toTitle = useGame((s) => s.toTitle)
  const lastOutcome = useGame((s) => s.lastOutcome)
  const diaryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    diaryRef.current?.scrollTo({ top: diaryRef.current.scrollHeight, behavior: 'smooth' })
  }, [life.diary.length])

  const canAge = life.alive && !life.pending && !lastOutcome

  return (
    <div className="h-full flex flex-col">
      {/* top bar */}
      <header className="safe-top bg-ink-soft/60 px-4 pt-2 pb-3">
        <div className="flex items-center justify-between">
          <button onClick={toTitle} className="text-xl opacity-70 active:opacity-100">☰</button>
          <div className="text-center">
            <div className="font-extrabold text-lg leading-tight">
              {life.firstName} {life.lastName}
            </div>
            <div className="text-xs opacity-70">
              {t('common.age', { age: life.age })} · {life.city}
            </div>
          </div>
          <div className="font-bold tabular-nums text-money">{formatMoney(life.money, i18n.language)}</div>
        </div>
      </header>

      {/* diary */}
      <div ref={diaryRef} className="flex-1 overflow-y-auto bg-cream text-ink px-4 py-3">
        <Diary entries={life.diary} people={life.people} />
      </div>

      {/* stats */}
      <section className="bg-ink-soft/60 px-4 py-3 flex flex-col gap-1.5">
        {(['happiness', 'health', 'smarts', 'looks'] as const).map((k) => (
          <StatBar key={k} label={t(`stats.${k}`)} emoji={STAT_EMOJI[k]} value={life.stats[k]} color={STAT_COLORS[k]} />
        ))}
      </section>

      {/* bottom nav */}
      <nav className="safe-bottom bg-ink px-2 pt-2 pb-2 grid grid-cols-5 items-end gap-1">
        <NavButton emoji="💼" label={t('nav.job')} />
        <NavButton emoji="🏠" label={t('nav.assets')} />
        <button
          onClick={ageUp}
          disabled={!canAge}
          className="rounded-2xl bg-accent text-ink font-extrabold py-3 -mt-6 shadow-lg shadow-black/30 disabled:opacity-40 active:scale-95 transition"
        >
          <div className="text-2xl leading-none">➕</div>
          <div className="text-xs mt-1">{t('nav.age')}</div>
        </button>
        <NavButton emoji="👥" label={t('nav.relationships')} />
        <NavButton emoji="🎯" label={t('nav.activities')} />
      </nav>

      {life.pending && !lastOutcome && <EventModal />}
      {lastOutcome && <OutcomeSheet />}
    </div>
  )
}

function NavButton({ emoji, label, onClick }: { emoji: string; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center py-1 opacity-80 active:opacity-100">
      <span className="text-2xl leading-none">{emoji}</span>
      <span className="text-[11px] mt-1">{label}</span>
    </button>
  )
}
