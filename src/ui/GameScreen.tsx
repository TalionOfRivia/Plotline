import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useGame } from '../state/store'
import { StatBar } from './StatBar'
import { Diary } from './Diary'
import { EventModal } from './EventModal'
import { OutcomeSheet } from './OutcomeSheet'
import { JobSheet } from './JobSheet'
import { AssetsSheet } from './AssetsSheet'
import { PeopleSheet } from './PeopleSheet'
import { ActivitiesSheet } from './ActivitiesSheet'
import { MenuSheet } from './MenuSheet'
import { ChallengesSheet } from './ChallengesSheet'
import { Toast } from './Toast'
import { formatMoney } from './money'
import { JOB_BY_ID, sysText } from '../engine/systems'

const STAT_COLORS = { happiness: 'var(--color-happy)', health: 'var(--color-health)', smarts: 'var(--color-smarts)', looks: 'var(--color-looks)' } as const
const STAT_EMOJI = { happiness: '😊', health: '❤️', smarts: '🧠', looks: '✨' } as const

export function GameScreen() {
  const { t, i18n } = useTranslation()
  const life = useGame((s) => s.life)!
  const ageUp = useGame((s) => s.ageUp)
  const openSheet = useGame((s) => s.openSheet)
  const sheet = useGame((s) => s.sheet)
  const lastOutcome = useGame((s) => s.lastOutcome)
  const diaryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    diaryRef.current?.scrollTo({ top: diaryRef.current.scrollHeight, behavior: 'smooth' })
  }, [life.diary.length, sheet])

  const canAge = life.alive && !life.pending && !lastOutcome
  const track = life.job ? JOB_BY_ID[life.job.trackId] : null
  const subtitle = life.prison ? `🔒 ${t('prison.short', { years: life.prison.yearsLeft })}`
    : track && life.job ? `${track.emoji} ${sysText(i18n.language, 'jobs', `tracks.${track.id}.ladder.${track.ladder[life.job.rung].id}`)}`
    : life.education.stage === 'university' ? `🎓 ${t('edu.stage.university')}`
    : life.education.stage === 'grad' ? `🎓 ${t('edu.stage.grad')}`
    : life.royalty.rank !== 'none' ? `👑 ${t(`royal.rank.${life.royalty.rank}`)}`
    : life.city

  return (
    <div className="h-full flex flex-col anim-fade">
      <header className="safe-top bg-chrome-soft/60 px-4 pt-2 pb-3 shadow-[0_1px_0_rgba(255,255,255,.06)]">
        <div className="flex items-center justify-between">
          <button onClick={() => openSheet('menu')} className="text-xl opacity-70 active:opacity-100 w-10 text-start">☰</button>
          <div className="text-center min-w-0">
            <div className="font-extrabold text-lg leading-tight truncate">{life.firstName} {life.lastName}</div>
            <div className="text-xs opacity-70 truncate">{t('common.age', { age: life.age })} · {subtitle}</div>
          </div>
          <div className={`font-bold tabular-nums w-20 text-end ${life.money < 0 ? 'text-health' : 'text-money'}`}>{formatMoney(life.money, i18n.language)}</div>
        </div>
      </header>

      <div ref={diaryRef} className="flex-1 overflow-y-auto bg-surface text-fg px-4 py-3 page-surface">
        <Diary entries={life.diary} people={life.people} countryCode={life.countryCode} />
      </div>

      <section className="bg-chrome-soft/60 px-4 py-3 flex flex-col gap-1.5">
        {(['happiness', 'health', 'smarts', 'looks'] as const).map((k) => (
          <StatBar key={k} label={t(`stats.${k}`)} emoji={STAT_EMOJI[k]} value={life.stats[k]} color={STAT_COLORS[k]} />
        ))}
      </section>

      <nav className="safe-bottom bg-chrome px-2 pt-2 pb-2 grid grid-cols-5 items-end gap-1">
        <NavButton emoji="💼" label={t('nav.job')} onClick={() => openSheet('job')} />
        <NavButton emoji="🏠" label={t('nav.assets')} onClick={() => openSheet('assets')} />
        <button onClick={ageUp} disabled={!canAge}
          className="rounded-2xl bg-accent text-on-accent font-extrabold py-3 -mt-6 shadow-lg shadow-black/30 disabled:opacity-40 active:scale-95 transition">
          <div className="text-2xl leading-none">➕</div>
          <div className="text-xs mt-1">{t('nav.age')}</div>
        </button>
        <NavButton emoji="👥" label={t('nav.relationships')} onClick={() => openSheet('people')} />
        <NavButton emoji="🎯" label={t('nav.activities')} onClick={() => openSheet('activities')} />
      </nav>

      {sheet === 'job' && <JobSheet />}
      {sheet === 'assets' && <AssetsSheet />}
      {sheet === 'people' && <PeopleSheet />}
      {sheet === 'activities' && <ActivitiesSheet />}
      {sheet === 'menu' && <MenuSheet />}
      {sheet === 'challenges' && <ChallengesSheet />}
      {life.pending && !lastOutcome && <EventModal />}
      {lastOutcome && <OutcomeSheet />}
      <Toast />
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
