import { useTranslation } from 'react-i18next'
import { useGame } from '../state/store'
import { EVENT_BY_ID, eventText } from '../engine/content'
import { choiceOdds } from '../engine/life'

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
      k === 'name' ? person?.firstName ?? '' : k === 'firstName' ? life.firstName : k === 'money' ? String(life.money) : '')

  if (!ev || !tx) return null

  return (
    <div className="fixed inset-0 z-20 bg-black/60 flex items-end sm:items-center justify-center p-3">
      <div className="w-full max-w-md bg-cream text-ink rounded-3xl p-5 shadow-2xl safe-bottom">
        <div className="text-4xl mb-2">{CATEGORY_EMOJI[ev.category] ?? '📌'}</div>
        <p className="text-lg font-semibold leading-snug mb-4">{fill(tx.text)}</p>
        <div className="flex flex-col gap-2">
          {ev.choices.map((c) => {
            const odds = c.showOdds ? choiceOdds(ev.id, c.id) : {}
            const best = Object.entries(odds).sort((a, b) => b[1] - a[1])[0]
            return (
              <button
                key={c.id}
                onClick={() => choose(c.id)}
                className="rounded-2xl bg-ink text-cream px-4 py-3 text-start font-semibold active:scale-[0.98] transition"
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
