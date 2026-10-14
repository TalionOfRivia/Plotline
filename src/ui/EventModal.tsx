import { useTranslation } from 'react-i18next'
import { useGame } from '../state/store'
import { EVENT_BY_ID, eventText } from '../engine/content'
import { choiceOdds } from '../engine/life'
import { JOB_BY_ID, sysText } from '../engine/systems'
import { formatMoney } from './money'

const CATEGORY_EMOJI: Record<string, string> = {
  childhood: '🧸', school: '🏫', family: '👨‍👩‍👧', social: '🎉', health: '🩺', money: '💵',
  work: '💼', romance: '💘', crime: '🚔', random: '🎲', death: '💀',
}

export function EventModal() {
  const { t, i18n } = useTranslation()
  const life = useGame((s) => s.life)!
  const choose = useGame((s) => s.choose)
  const pend = life.pending!
  const ev = EVENT_BY_ID[pend.eventId]
  const tx = eventText(i18n.language, pend.eventId)
  const person = life.people.find((p) => p.id === pend.personId)
  const fill = (s: string) =>
    s.replace(/\{\{(\w+)\}\}/g, (_, k) =>
      k === 'name' ? person?.firstName ?? '' : k === 'firstName' ? life.firstName : k === 'money' ? String(life.money) : k === 'offer' ? offerText()
        : k === 'charge' ? sysText(i18n.language, 'crimes', `${String(life.flags.charge_crime ?? '')}.name`) : k === 'years' ? String(life.flags.charge_years ?? '') : k === 'pay' ? formatMoney(Number(life.flags.sponsor_pay) || 0, i18n.language) : '')
  function offerText() {
    const tr = JOB_BY_ID[String(life.flags.offer_track ?? '')]
    if (!tr) return ''
    const rung = tr.ladder[Number(life.flags.offer_rung) || 0]
    return `${sysText(i18n.language, 'jobs', `tracks.${tr.id}.ladder.${rung.id}`)} · ${formatMoney(Number(life.flags.offer_salary) || rung.salary, i18n.language)}/${t('work.yr')}`
  }

  if (!ev || !tx) return null

  return (
    <div className="fixed inset-0 z-20 bg-black/60 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-3 anim-fade">
      <div className="w-full max-w-md bg-surface text-fg rounded-3xl p-5 shadow-2xl safe-bottom anim-rise">
        <div className="text-4xl mb-2">{CATEGORY_EMOJI[ev.category] ?? '📌'}</div>
        <p className="text-lg font-semibold leading-snug mb-4">{fill(tx.text)}</p>
        <div className="flex flex-col gap-2">
          <button onClick={() => choose(ev.choices[Math.floor(Math.random() * ev.choices.length)].id)} className="self-end text-xs underline opacity-60 -mt-2 mb-1">🎲 {t('event.surprise')}</button>
          {ev.choices.map((c) => {
            const odds = c.showOdds ? choiceOdds(ev.id, c.id) : {}
            const best = Object.entries(odds).sort((a, b) => b[1] - a[1])[0]
            return (
              <button
                key={c.id}
                onClick={() => choose(c.id)}
                className="rounded-2xl bg-chrome text-chrome-fg px-4 py-3 text-start font-semibold active:scale-[0.98] transition"
              >
                <div>{fill(tx.choices[c.id] ?? c.id)}</div>
                {best && (
                  <div className="text-xs opacity-70 font-normal mt-0.5">
                    {t('event.odds', { pct: Math.round(best[1] * 100), outcome: fill(tx.outcomes?.[best[0]] ?? best[0]) })}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
