import { useTranslation } from 'react-i18next'
import type { DiaryEntry, Person } from '../engine/types'
import { eventText } from '../engine/content'
import { sysText } from '../engine/systems'

/**
 * Diary entries store either an i18n key ("diary.born") or an event reference
 * ("event:<id>:<choice>[:<outcome>]"); both are rendered in the current language.
 */
export function renderEntry(e: DiaryEntry, lang: string, t: (k: string, p?: Record<string, unknown>) => string): string {
  if (e.text.startsWith('event:')) {
    const [, id, choiceId, outcomeId] = e.text.split(':')
    const tx = eventText(lang, id)
    if (!tx) return id
    const params = { ...(e.params ?? {}) }
    const fill = (s: string) => s.replace(/\{\{(\w+)\}\}/g, (_, k) => String(params[k] ?? ''))
    const parts = [fill(tx.text), `→ ${fill(tx.choices[choiceId] ?? choiceId)}`]
    if (outcomeId && tx.outcomes?.[outcomeId]) parts.push(fill(tx.outcomes[outcomeId]))
    return parts.join(' ')
  }
  const params = { ...(e.params ?? {}) }
  if (typeof params.kind === 'string') params.kind = t(`kind.${params.kind}`)
  if (e.text === 'challenge.completed' && typeof params.id === 'string') params.id = sysText(lang, 'challenges', `${params.id}.name`)
  return t(e.text, params)
}

const KIND_STYLE: Record<DiaryEntry['kind'], string> = {
  milestone: 'font-bold mt-3',
  info: 'opacity-80',
  event: '',
  death: 'font-bold text-health mt-3',
  good: 'text-good',
  bad: 'text-bad',
}

export function Diary({ entries }: { entries: DiaryEntry[]; people: Person[] }) {
  const { t, i18n } = useTranslation()
  return (
    <div className="flex flex-col gap-1.5 text-[15px] leading-snug">
      {entries.map((e, i) => (
        e.text === 'diary.birthday' ? (
          <div key={i} className="flex items-center gap-2 mt-3 mb-1">
            <span className="flex-1 h-px bg-fg/15" />
            <span className="text-[11px] font-bold tracking-widest uppercase opacity-60">{t('common.age', { age: e.params?.age })}</span>
            <span className="flex-1 h-px bg-fg/15" />
          </div>
        ) : (
        <p key={i} className={`${KIND_STYLE[e.kind]} ${i === entries.length - 1 ? 'anim-fade' : ''}`}>
          {renderEntry(e, i18n.language, t)}
        </p>
        )
      ))}
    </div>
  )
}
