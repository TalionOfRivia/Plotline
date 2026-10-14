import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGame } from '../state/store'
import { Pill, Row, Section, Sheet } from './Sheet'
import { availableInteractions, HONEYMOONS, INTERACTIONS, VENUES, weddingCost, type Interaction } from '../engine/relationships'
import { netWorth } from '../engine/assets'
import type { Person } from '../engine/types'
import { formatMoney } from './money'

const KIND_EMOJI: Record<Person['kind'], string> = {
  mother: '👩', father: '👨', sibling: '🧑‍🤝‍🧑', friend: '🙂', partner: '💑', spouse: '💍', ex: '💔', child: '🧒', pet: '🐾', grandparent: '🧓', in_law: '🧑‍🦳',
}
const ACTION_EMOJI: Record<Interaction, string> = {
  spend_time: '⏳', gift: '🎁', compliment: '🌟', insult: '😠', ask_money: '🙏', flirt: '😘', propose: '💍', break_up: '💔',
  have_child: '👶', adopt: '🧸', prenup: '📜', play: '🎾', walk: '🐕', movie_night: '🎬', vacation: '✈️',
  conversation: '💬', party: '🍾', concert: '🎤', prank: '🤡', rumor: '😈', deal: '🤝', hook_up: '🖤', ask_out: '❤️', give_money: '💸', elope: '💒', counseling: '🛋️', best_friend: '🤝', spy: '🔍',
}

export function PeopleSheet() {
  const { t, i18n } = useTranslation()
  const life = useGame((s) => s.life)!
  const { interact, date, godMode, godEditPerson, datingApp, surrogacy } = useGame()
  const [ageMin, setAgeMin] = useState(18)
  const [ageMax, setAgeMax] = useState(35)
  const [selected, setSelected] = useState<string | null>(null)
  const [dating, setDating] = useState(false)
  const [venue, setVenue] = useState('backyard')
  const [honeymoon, setHoneymoon] = useState('road_trip')
  const wedding = useGame((s) => s.wedding)
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
          {person.kind !== 'pet' && <div className="mt-1 text-xs opacity-60">✨ {person.looks ?? '?'} · 🧠 {person.smarts ?? '?'} · 🤪 {person.craziness ?? '?'}{person.yearsTogether !== undefined && ` · ${t('people.yearsTogether', { n: person.yearsTogether })}`}</div>}
          <div className="mt-1 flex gap-1 flex-wrap">{person.bestFriend && <Pill tone="good">{t('people.bestFriendBadge')}</Pill>}{person.enemy && <Pill tone="bad">{t('people.enemyBadge')}</Pill>}{person.engaged && <Pill>{t('people.engagedBadge')}</Pill>}{person.movedOut && <Pill>{t('people.movedOutBadge')}</Pill>}{person.sick && <Pill tone="bad">{t('people.sickBadge')}</Pill>}</div>
          {(person.kind === 'partner') && person.money !== undefined && <div className="mt-1 text-xs opacity-60">{t('people.prenupInfo', { yours: formatMoney(netWorth(life), lang), theirs: formatMoney(person.money, lang) })}</div>}
        </div>
        {godMode && (
          <div className="bg-card rounded-2xl p-3 mb-3 shadow-sm text-sm">
            <div className="text-xs uppercase tracking-widest opacity-60 mb-1">⚡ {t('menu.godMode')}</div>
            <input type="range" min={0} max={100} value={person.relationship} onChange={(e) => godEditPerson(person.id, Number(e.target.value))} className="w-full" />
          </div>
        )}
        {person.engaged && (
          <Section title={t('people.weddingPlan')}>
            <div className="bg-card rounded-2xl p-3 mb-2 shadow-sm text-sm">
              <div className="text-xs uppercase tracking-widest opacity-60 mb-1">{t('people.venue')}</div>
              <div className="flex flex-wrap gap-1 mb-2">{VENUES.map((v) => <button key={v.id} onClick={() => setVenue(v.id)} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${venue === v.id ? 'bg-chrome text-chrome-fg' : 'bg-fg/5'}`}>{t(`people.venues.${v.id}`)} · {formatMoney(v.cost, lang)}</button>)}</div>
              <div className="text-xs uppercase tracking-widest opacity-60 mb-1">{t('people.honeymoon')}</div>
              <div className="flex flex-wrap gap-1 mb-2">{HONEYMOONS.map((h) => <button key={h.id} onClick={() => setHoneymoon(h.id)} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${honeymoon === h.id ? 'bg-chrome text-chrome-fg' : 'bg-fg/5'}`}>{t(`people.honeymoons.${h.id}`)} · {formatMoney(h.cost, lang)}</button>)}</div>
              <button onClick={() => wedding(person.id, venue, honeymoon)} disabled={life.money < weddingCost(venue, honeymoon)} className="w-full rounded-2xl bg-accent text-on-accent font-bold py-3 disabled:opacity-40">{t('people.holdWedding', { money: formatMoney(weddingCost(venue, honeymoon), lang) })}</button>
            </div>
          </Section>
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
        {!hasPartner && life.age >= 18 && (
          <div className="bg-card rounded-2xl p-3 mb-3 shadow-sm text-sm">
            <div className="font-semibold mb-1">📱 {t('people.datingApp')}</div>
            <div className="flex items-center gap-2 text-xs"><span>{t('people.ageRange')}</span><input type="number" value={ageMin} min={18} max={99} onChange={(e) => setAgeMin(Number(e.target.value))} className="w-14 rounded-lg bg-surface px-2 py-1" /><span>–</span><input type="number" value={ageMax} min={18} max={99} onChange={(e) => setAgeMax(Number(e.target.value))} className="w-14 rounded-lg bg-surface px-2 py-1" /><button onClick={() => datingApp(Math.min(ageMin, ageMax), Math.max(ageMin, ageMax))} className="ml-auto px-3 py-1.5 rounded-xl bg-accent text-on-accent font-semibold">{t('people.swipe')} · $30</button></div>
          </div>
        )}
        {hasPartner ? <p className="text-sm opacity-70">{t('people.alreadyTaken')}</p> : life.dateBoard.length === 0 ? <p className="text-sm opacity-70">{t('people.nobodyAround')}</p> : null}
        {!hasPartner && life.dateBoard.map((c) => (
          <Row key={c.id} emoji={c.gender === 'female' ? '👩' : '👨'} title={`${c.firstName} ${c.lastName}`}
            sub={`${t('common.age', { age: c.age })} · ✨${c.looks} · 🧠${c.smarts}${c.income ? ` · ${formatMoney(c.income, lang)}/${t('work.yr')}` : ''}`}
            right={t('people.askOut')} onClick={() => { date(c.id); setDating(false) }} />
        ))}
      </Sheet>
    )
  }

  const groups: Person['kind'][] = ['spouse', 'partner', 'child', 'mother', 'father', 'sibling', 'grandparent', 'in_law', 'friend', 'pet', 'ex']
  return (
    <Sheet title={t('nav.relationships')} emoji="👥">
      {life.age >= 15 && !life.prison && <Row emoji="💘" title={t('people.findDate')} sub={hasPartner ? t('people.alreadyTaken') : t('people.findDateSub')} onClick={() => setDating(true)} />}
      {life.age >= 21 && <Row emoji="🍼" title={t('people.surrogacy')} sub={t('people.surrogacySub')} right={formatMoney(80_000, lang)} onClick={surrogacy} disabled={life.money < 80_000} />}
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
