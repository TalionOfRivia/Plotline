import { useTranslation } from 'react-i18next'
import { useGame } from '../state/store'
import { formatMoney } from './money'
import { netWorth } from '../engine/assets'
import { heirs } from '../engine/life'
import { RIBBONS, sysText } from '../engine/systems'
import { Row } from './Sheet'

export function TombstoneScreen() {
  const { t, i18n } = useTranslation()
  const life = useGame((s) => s.life)!
  const newLife = useGame((s) => s.newLife)
  const continueAs = useGame((s) => s.continueAs)
  const undoYear = useGame((s) => s.undoYear)
  const undo = useGame((s) => s.undo)
  const lang = i18n.language
  const cause = life.causeOfDeath ?? 'death.sudden'
  const causeText = cause.startsWith('death.') ? t(cause, { defaultValue: t('death.generic', { cause: cause.slice(6).replace(/_/g, ' ') }) }) : cause
  const ribbon = RIBBONS.find((r) => r.id === life.ribbon)
  const kids = heirs(life)

  return (
    <main className="h-full overflow-y-auto flex flex-col items-center gap-5 px-6 py-8 safe-top safe-bottom text-center">
      <div className="text-6xl">🪦</div>
      <div className="bg-cream text-ink rounded-3xl px-6 py-6 w-full max-w-sm shadow-xl">
        <div className="text-xs uppercase tracking-widest opacity-60">{t('death.restInPeace')}</div>
        <div className="text-2xl font-extrabold mt-1">{life.firstName} {life.lastName}</div>
        <div className="opacity-70 mt-1">{t('death.lived', { years: life.age })}</div>
        <div className="mt-3 font-semibold">{causeText}</div>
        {ribbon && (
          <div className="mt-4 bg-ink text-cream rounded-2xl p-3">
            <div className="text-3xl">{ribbon.emoji}</div>
            <div className="font-bold">{sysText(lang, 'ribbons', `${ribbon.id}.name`)}</div>
            <div className="text-xs opacity-80 mt-1">{sysText(lang, 'ribbons', `${ribbon.id}.blurb`)}</div>
          </div>
        )}
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <Stat label={t('death.netWorth')} value={formatMoney(netWorth(life), lang)} />
          <Stat label={t('stats.happiness')} value={String(Math.round(life.stats.happiness))} />
          <Stat label={t('death.events')} value={String(life.diary.filter((d) => d.kind === 'event').length)} />
          <Stat label={t('death.karma')} value={life.karma > 20 ? '😇' : life.karma < -20 ? '😈' : '😐'} />
          <Stat label={t('death.kids')} value={String(life.people.filter((p) => p.kind === 'child').length)} />
          <Stat label={t('death.marriages')} value={String(life.marriages)} />
        </div>
      </div>

      {kids.length > 0 && (
        <div className="w-full max-w-sm text-start">
          <h3 className="text-xs uppercase tracking-widest opacity-60 mb-2 px-1">{t('death.continueAs')}</h3>
          {kids.map((k) => (
            <Row key={k.id} emoji={k.gender === 'female' ? '👧' : '👦'} title={`${k.firstName} ${k.lastName}`} sub={t('common.age', { age: k.age })} onClick={() => continueAs(k.id)} />
          ))}
        </div>
      )}

      <div className="w-full max-w-sm flex flex-col gap-2">
        <button onClick={() => newLife()} className="rounded-2xl bg-accent text-ink font-bold text-lg py-4 active:scale-95 transition">{t('menu.newLife')}</button>
        {undo && <button onClick={undoYear} className="rounded-2xl bg-ink-soft font-semibold py-3 active:scale-95 transition">⏪ {t('menu.undo')}</button>}
      </div>
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
