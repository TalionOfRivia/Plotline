import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGame } from '../state/store'
import { Pill, Row, Section, Sheet } from './Sheet'
import { availableInteractions, INTERACTIONS, type Interaction } from '../engine/relationships'
import type { Person } from '../engine/types'
import { formatMoney } from './money'

const KIND_EMOJI: Record<Person['kind'], string> = {
  mother: '👩', father: '👨', sibling: '🧑‍🤝‍🧑', friend: '🙂', partner: '💑', spouse: '💍', ex: '💔', child: '🧒', pet: '🐾',
}
const ACTION_EMOJI: Record<Interaction, string> = {
  spend_time: '⏳', gift: '🎁', compliment: '🌟', insult: '😠', ask_money: '🙏', flirt: '😘', propose: '💍', break_up: '💔',
  have_child: '👶', adopt: '🧸', prenup: '📜', play: '🎾', walk: '🐕', movie_night: '🎬', vacation: '✈️',
  conversation: '💬', party: '🍾', concert: '🎤', prank: '🤡', rumor: '😈', deal: '🤝', hook_up: '🖤', ask_out: '❤️',
}

export function PeopleSheet() {
  const { t, i18n } = useTranslation()
  const life = useGame((s) => s.life)!
  const { interact, date, godMode, godEditPerson } = useGame()
  const [selected, setSelected] = useState<string | null>(null)
  const [dating, setDating] = useState(false)
  const lang = i18n.language
  const person = life.people.find((p) => p.id === selected)
  const hasPartner = life.people.some((p) => (p.kind === 'partner' || p.kind === 'spouse') && p.alive)

  if (person) {
    const opts = availableInteractions(life, person)
    return (
      <Sheet title={`${person.firstName} ${person.lastName}`} emoji={KIND_EMOJI[person.kind]} onBack={() => setSelected(null)}>
        <div className="bg-card rounded-2xl p-4 mb-4 shadow-sm">
          <div className="text-sm opacity-70">{t(`kind.${person.kind}`)} · {t('common.age', { age: person.age })}{person.income ? ` · ${formatMoney(person.income, lang)}/${t('work.yr')}` : ''}</div>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span>❤️</span>
            <div className="flex-1 h-3 rounded-full bg-fg/10 overflow-hidden"><div className="h-full bg-health transition-[width]" style={{ width: `${person.relationship}%` }} /></div>
            <span className="tabular-nums w-8 text-end">{Math.round(person.relationship)}</span>
          </div>
          {person.kind !== 'pet' && <div className="mt-1 text-xs opacity-60">✨ {person.looks ?? '?'} · 🧠 {person.smarts ?? '?'}{person.yearsTogether !== undefined && ` · ${t('people.yearsTogether', { n: person.yearsTogether })}`}</div>}
        </div>
        {godMode && (
          <div className="bg-card rounded-2xl p-3 mb-3 shadow-sm text-sm">
            <div className="text-xs uppercase tracking-widest opacity-60 mb-1">⚡ {t('menu.godMode')}</div>
            <input type="range" min={0} max={100} value={person.relationship} onChange={(e) => godEditPerson(person.id, Number(e.target.value))} className="w-full" />
          </div>
        )}
        <Section title={t('people.interact')}>
          {opts.map((k) => (
            <Row key={k} emoji={ACTION_EMOJI[k]} title={t(`people.action.${k}`)} right={INTERACTIONS[k].cost ? formatMoney(INTERACTIONS[k].cost, lang) : undefined}
              onClick={() => interact(person.id, k)} disabled={life.money < INTERACTIONS[k].cost} />
          ))}
        </Section>
      </Sheet>
    )
  }

  if (dating) {
    return (
      <Sheet title={t('people.dating')} emoji="💘" onBack={() => setDating(false)}>
        {hasPartner ? <p className="text-sm opacity-70">{t('people.alreadyTaken')}</p> : life.dateBoard.length === 0 ? <p className="text-sm opacity-70">{t('people.nobodyAround')}</p> : null}
        {!hasPartner && life.dateBoard.map((c) => (
          <Row key={c.id} emoji={c.gender === 'female' ? '👩' : '👨'} title={`${c.firstName} ${c.lastName}`}
            sub={`${t('common.age', { age: c.age })} · ✨${c.looks} · 🧠${c.smarts}${c.income ? ` · ${formatMoney(c.income, lang)}/${t('work.yr')}` : ''}`}
            right={t('people.askOut')} onClick={() => { date(c.id); setDating(false) }} />
        ))}
      </Sheet>
    )
  }

  const groups: Person['kind'][] = ['spouse', 'partner', 'child', 'mother', 'father', 'sibling', 'friend', 'pet', 'ex']
  return (
    <Sheet title={t('nav.relationships')} emoji="👥">
      {life.age >= 15 && !life.prison && <Row emoji="💘" title={t('people.findDate')} sub={hasPartner ? t('people.alreadyTaken') : t('people.findDateSub')} onClick={() => setDating(true)} />}
      {groups.map((kind) => {
        const list = life.people.filter((p) => p.kind === kind)
        if (!list.length) return null
        return (
          <Section key={kind} title={t(`kind.${kind}`)}>
            {list.map((p) => (
              <Row key={p.id} emoji={KIND_EMOJI[kind]} title={`${p.firstName} ${p.lastName}`.trim()}
                sub={p.alive ? t('common.age', { age: p.age }) : t('people.deceased')}
                right={p.alive ? <Pill tone={p.relationship > 60 ? 'good' : p.relationship < 30 ? 'bad' : 'ink'}>❤️ {Math.round(p.relationship)}</Pill> : '🪦'}
                onClick={p.alive ? () => setSelected(p.id) : undefined} />
            ))}
          </Section>
        )
      })}
    </Sheet>
  )
}
