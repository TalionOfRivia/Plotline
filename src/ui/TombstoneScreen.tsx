import { useTranslation } from 'react-i18next'
import { useGame } from '../state/store'
import { formatMoney } from './money'

export function TombstoneScreen() {
  const { t, i18n } = useTranslation()
  const life = useGame((s) => s.life)!
  const newLife = useGame((s) => s.newLife)
  const cause = life.causeOfDeath ?? 'death.sudden'
  const causeText = cause.startsWith('death.') ? t(cause) : cause

  return (
    <main className="h-full flex flex-col items-center justify-center gap-6 px-6 safe-top safe-bottom text-center">
      <div className="text-7xl">🪦</div>
      <div className="bg-cream text-ink rounded-3xl px-6 py-6 w-full max-w-sm shadow-xl">
        <div className="text-xs uppercase tracking-widest opacity-60">{t('death.restInPeace')}</div>
        <div className="text-2xl font-extrabold mt-1">{life.firstName} {life.lastName}</div>
        <div className="opacity-70 mt-1">{t('death.lived', { years: life.age })}</div>
        <div className="mt-3 font-semibold">{causeText}</div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <Stat label={t('death.netWorth')} value={formatMoney(life.money, i18n.language)} />
          <Stat label={t('stats.happiness')} value={String(life.stats.happiness)} />
          <Stat label={t('death.events')} value={String(life.diary.filter((d) => d.kind === 'event').length)} />
          <Stat label={t('death.karma')} value={life.karma > 20 ? '😇' : life.karma < -20 ? '😈' : '😐'} />
        </div>
      </div>
      <button onClick={() => newLife()} className="w-full max-w-sm rounded-2xl bg-accent text-ink font-bold text-lg py-4 active:scale-95 transition">
        {t('menu.newLife')}
      </button>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ink/5 rounded-xl py-2">
      <div className="text-[11px] opacity-60">{label}</div>
      <div className="font-bold">{value}</div>
    </div>
  )
}
