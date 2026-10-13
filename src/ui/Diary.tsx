import { useTranslation } from 'react-i18next'
import type { DiaryEntry, Person } from '../engine/types'
import { eventText } from '../engine/content'

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
  return t(e.text, params)
}

const KIND_STYLE: Record<DiaryEntry['kind'], string> = {
  milestone: 'font-bold mt-3',
  info: 'opacity-80',
  event: '',
  death: 'font-bold text-health mt-3',
}

export function Diary({ entries }: { entries: DiaryEntry[]; people: Person[] }) {
  const { t, i18n } = useTranslation()
  return (
    <div className="flex flex-col gap-1.5 text-[15px] leading-snug">
      {entries.map((e, i) => (
        <p key={i} className={KIND_STYLE[e.kind]}>
          {renderEntry(e, i18n.language, t)}
        </p>
      ))}
    </div>
  )
}
