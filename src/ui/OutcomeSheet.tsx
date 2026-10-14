import { useTranslation } from 'react-i18next'
import { useGame } from '../state/store'
import { eventText } from '../engine/content'

/** Shown after a choice with a random outcome, so the result lands before the next year. */
export function OutcomeSheet() {
  const { t, i18n } = useTranslation()
  const last = useGame((s) => s.lastOutcome)
  const dismiss = useGame((s) => s.dismissOutcome)
  const life = useGame((s) => s.life)
  const tx = last ? eventText(i18n.language, last.eventId) : undefined
  const text = last?.outcomeId ? tx?.outcomes?.[last.outcomeId] : undefined
  const entry = life?.diary.at(-1)
  const name = String(entry?.params?.name ?? '')
  const fill = (s: string) => s.replace(/\{\{name\}\}/g, name).replace(/\{\{firstName\}\}/g, life?.firstName ?? '')

  const who = life?.people.find((p) => p.firstName === name && p.alive)
  const reaction = who ? { name: who.firstName, value: who.relationship } : null
  // Nothing to show for a fixed-effect choice (or already dismissed): auto-dismiss.
  if (!last || !life) return null
  if (!text) { queueMicrotask(dismiss); return null }

  return (
    <div className="fixed inset-0 z-20 bg-black/60 flex items-end sm:items-center justify-center p-3" onClick={dismiss}>
      <div className="w-full max-w-md bg-surface text-fg rounded-3xl p-5 shadow-2xl safe-bottom anim-rise">
        <div className="text-4xl mb-2">🎲</div>
        <p className="text-lg font-semibold leading-snug mb-4">{fill(text)}</p>
        {reaction && (
          <div className="mb-4 text-sm">
            <div className="flex justify-between text-xs opacity-70 mb-1"><span>{t('event.reaction', { name: reaction.name })}</span><span>{Math.round(reaction.value)}%</span></div>
            <div className="h-2 rounded-full bg-fg/10 overflow-hidden"><div className={`h-full ${reaction.value > 55 ? 'bg-money' : reaction.value < 35 ? 'bg-health' : 'bg-happy'}`} style={{ width: `${reaction.value}%` }} /></div>
          </div>
        )}
        <button className="w-full rounded-2xl bg-accent text-on-accent font-bold py-3">{t('common.ok')}</button>
      </div>
    </div>
  )
}
