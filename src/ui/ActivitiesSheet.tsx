import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGame } from '../state/store'
import { Pill, Row, Section, Sheet } from './Sheet'
import { ACTIVITIES, CRIMES, EDUCATION, sysText } from '../engine/systems'
import { crimeOdds } from '../engine/crime'
import { canEnrollUniversity, gradSchoolsAvailable } from '../engine/school'
import { BUSINESS_KINDS, MAFIA_RANKS, canApplyAgent, canApplyAstronaut } from '../engine/special'
import { formatMoney } from './money'

type Page = 'hub' | 'activities' | 'education' | 'crime' | 'special' | 'business'

export function ActivitiesSheet() {
  const { t, i18n } = useTranslation()
  const life = useGame((s) => s.life)!
  const g = useGame()
  const [page, setPage] = useState<Page>('hub')
  const [bizName, setBizName] = useState('')
  const lang = i18n.language
  const back = () => setPage('hub')
  const toast = (key: string, kind: 'good' | 'bad' | 'info', params?: Record<string, string | number>) => g.setToast({ key, kind, params })

  if (page === 'activities') return (
    <Sheet title={t('act.mindBody')} emoji="🧘" onBack={back}>
      {ACTIVITIES.filter((a) => life.age >= a.minAge).map((a) => (
        <Row key={a.id} emoji={a.emoji} title={sysText(lang, 'activities', `${a.id}.name`)} sub={sysText(lang, 'activities', `${a.id}.blurb`)}
          right={a.cost ? formatMoney(a.cost, lang) : t('act.free')} disabled={life.money < a.cost || Boolean(life.prison)}
          onClick={() => { const r = g.activity(a.id); if (r) toast(r.key, r.kind, { money: r.money ? formatMoney(r.money, lang) : '' }) }} />
      ))}
    </Sheet>
  )

  if (page === 'education') {
    const ed = life.education
    return (
      <Sheet title={t('act.education')} emoji="🎓" onBack={back}>
        <div className="bg-paper rounded-2xl p-4 mb-4 shadow-sm text-sm">
          <div><b>{t(`edu.stage.${ed.stage}`)}</b>{ed.major && <> · {sysText(lang, 'education', `majors.${ed.major}`)}</>}{ed.gradSchool && ed.stage === 'grad' && <> · {sysText(lang, 'education', `gradSchools.${ed.gradSchool}`)}</>}</div>
          {(ed.stage === 'primary' || ed.stage === 'high_school' || ed.stage === 'university' || ed.stage === 'grad') && (
            <div className="mt-2 flex items-center gap-2"><span>{t('edu.grades')}</span>
              <div className="flex-1 h-2 rounded-full bg-ink/10 overflow-hidden"><div className="h-full bg-smarts" style={{ width: `${ed.grades}%` }} /></div>
              <span className="tabular-nums">{Math.round(ed.grades)}</span></div>
          )}
          {ed.degrees.length > 0 && <div className="mt-2 opacity-70">{t('edu.degrees')}: {ed.degrees.map((d) => d.startsWith('grad_') ? sysText(lang, 'education', `gradSchools.${d}`) : t(`edu.${d}`)).join(', ')}</div>}
          {ed.loans > 0 && <div className="mt-1 text-red-700">{t('edu.loans')}: {formatMoney(ed.loans, lang)}</div>}
        </div>
        {ed.stage !== 'none' && ed.stage !== 'done' && <Row emoji="📚" title={t('edu.study')} sub={t('edu.studySub')} onClick={g.study} />}
        {canEnrollUniversity(life) && (
          <Section title={t('edu.enrollUni', { money: formatMoney(EDUCATION.universityCost, lang) })}>
            <p className="text-xs opacity-70 px-1 mb-2">{t('edu.fundingHint', { smarts: EDUCATION.scholarshipMinSmarts })}</p>
            {EDUCATION.majors.map((m) => {
              const ok = life.stats.smarts >= m.minSmarts
              const funding = life.stats.smarts >= EDUCATION.scholarshipMinSmarts ? 'scholarship' : life.money >= EDUCATION.universityCost ? 'cash' : 'loan'
              return <Row key={m.id} emoji={m.emoji} title={sysText(lang, 'education', `majors.${m.id}`)} sub={`🧠 ${m.minSmarts}+ · ${t(`edu.funding.${funding}`)}`}
                right={ok ? undefined : <Pill tone="bad">🧠</Pill>} disabled={!ok} onClick={() => g.enrollUni(m.id, funding)} />
            })}
          </Section>
        )}
        {gradSchoolsAvailable(life).length > 0 && (
          <Section title={t('edu.gradSchools')}>
            {gradSchoolsAvailable(life).map((gs) => (
              <Row key={gs.id} emoji={gs.emoji} title={sysText(lang, 'education', `gradSchools.${gs.id}`)} sub={`${gs.years} ${t('edu.years')} · ${formatMoney(gs.cost, lang)}`} onClick={() => g.enrollGrad(gs.id)} />
            ))}
          </Section>
        )}
      </Sheet>
    )
  }

  if (page === 'crime') return (
    <Sheet title={t('act.crime')} emoji="🚔" onBack={back}>
      <p className="text-xs opacity-70 px-1 mb-3">{t('crime.hint', { record: life.convictions })}</p>
      {CRIMES.filter((c) => life.age >= c.minAge).map((c) => {
        const odds = crimeOdds(c.id, life)
        return <Row key={c.id} emoji={c.emoji} title={sysText(lang, 'crimes', `${c.id}.name`)}
          sub={`${formatMoney(c.payout[0], lang)}–${formatMoney(c.payout[1], lang)} · ${t('crime.sentence', { a: c.sentenceYears[0], b: c.sentenceYears[1] })}`}
          right={<Pill tone={odds > 0.5 ? 'good' : odds > 0.25 ? 'ink' : 'bad'}>{Math.round(odds * 100)}%</Pill>}
          disabled={Boolean(life.prison)}
          onClick={() => {
            const r = g.crime(c.id)
            if (!r) return
            if (r.ok) toast('crime.toast.success', 'good', { text: sysText(lang, 'crimes', `${c.id}.success`).replace('{{money}}', formatMoney(r.money, lang)) })
            else toast('crime.toast.caught', 'bad', { text: sysText(lang, 'crimes', `${c.id}.caught`), years: r.years })
          }} />
      })}
    </Sheet>
  )

  if (page === 'business') return (
    <Sheet title={t('biz.title')} emoji="🏢" onBack={back}>
      {life.business ? (
        <>
          <div className="bg-paper rounded-2xl p-4 mb-3 shadow-sm">
            <div className="text-xl font-bold">{life.business.name}</div>
            <div className="text-sm opacity-70">{t(`biz.kind.${life.business.kind}`)} · {t('biz.years', { n: life.business.yearsRunning })}</div>
            <div className="mt-2">{t('biz.value')}: <b>{formatMoney(life.business.value, lang)}</b></div>
          </div>
          <Row emoji="💸" title={t('biz.sell', { money: formatMoney(Math.round(life.business.value * 0.9), lang) })} onClick={g.sellBusiness} />
        </>
      ) : (
        <>
          <input value={bizName} onChange={(e) => setBizName(e.target.value)} placeholder={t('biz.namePlaceholder')} className="w-full rounded-2xl bg-paper px-4 py-3 mb-3 shadow-sm outline-none" />
          {BUSINESS_KINDS.map((b) => (
            <Row key={b.id} emoji="🏢" title={t(`biz.kind.${b.id}`)} right={formatMoney(b.cost, lang)} disabled={life.money < b.cost || life.age < 18} onClick={() => g.startBusiness(b.id, bizName)} />
          ))}
        </>
      )}
    </Sheet>
  )

  if (page === 'special') return (
    <Sheet title={t('act.special')} emoji="🌟" onBack={back}>
      <Section title={t('fame.title')}>
        <div className="bg-paper rounded-2xl p-3 mb-2 shadow-sm text-sm flex items-center gap-2">
          <span>⭐ {t('fame.level')}</span>
          <div className="flex-1 h-2 rounded-full bg-ink/10 overflow-hidden"><div className="h-full bg-happy" style={{ width: `${life.fame}%` }} /></div>
          <span className="tabular-nums">{Math.round(life.fame)}</span>
        </div>
        {life.age >= 13 && <Row emoji="📱" title={t('fame.post')} sub={t('fame.postSub')} onClick={g.post} />}
      </Section>
      <Section title={t('act.paths')}>
        <Row emoji="🏢" title={t('biz.title')} sub={life.business ? life.business.name : t('biz.sub')} onClick={() => setPage('business')} />
        {life.mafia ? (
          <Row emoji="🕴️" title={t('mafia.title')} sub={`${t(`mafia.rank.${MAFIA_RANKS[life.mafia.rank]}`)} · ${t('mafia.respect')} ${Math.round(life.mafia.respect)}`} />
        ) : life.age >= 18 && !life.flags.witness_protection ? (
          <Row emoji="🕴️" title={t('mafia.join')} sub={t('mafia.joinSub')} onClick={g.joinMafia} />
        ) : null}
        {life.flags.astronaut || life.flags.astronaut_program ? (
          <Row emoji="🚀" title={t('space.title')} sub={life.flags.astronaut ? t('space.active', { n: Number(life.flags.missions) || 0 }) : t('space.training')} />
        ) : (
          <Row emoji="🚀" title={t('space.apply')} sub={t('space.req')} disabled={!canApplyAstronaut(life)} onClick={g.applyAstronaut} />
        )}
        {life.flags.agent ? (
          <Row emoji="🕵️" title={t('agent.title')} sub={life.flags.agent_senior ? t('agent.senior') : t('agent.field')} />
        ) : (
          <Row emoji="🕵️" title={t('agent.apply')} sub={t('agent.req')} disabled={!canApplyAgent(life)} onClick={g.applyAgent} />
        )}
        {life.royalty.rank !== 'none' && (
          <Row emoji="👑" title={t(`royal.rank.${life.royalty.rank}`)} sub={`${t('royal.popularity')} ${Math.round(life.royalty.popularity)}`} />
        )}
      </Section>
    </Sheet>
  )

  return (
    <Sheet title={t('nav.activities')} emoji="🎯">
      <Row emoji="🧘" title={t('act.mindBody')} sub={t('act.mindBodySub')} onClick={() => setPage('activities')} />
      <Row emoji="🎓" title={t('act.education')} sub={t(`edu.stage.${life.education.stage}`)} onClick={() => setPage('education')} />
      {life.age >= 12 && <Row emoji="🚔" title={t('act.crime')} sub={t('act.crimeSub')} onClick={() => setPage('crime')} />}
      <Row emoji="🌟" title={t('act.special')} sub={t('act.specialSub')} onClick={() => setPage('special')} />
      {life.prison && (
        <div className="bg-paper rounded-2xl p-4 mt-2 shadow-sm text-sm">
          🔒 {t('prison.status', { years: life.prison.yearsLeft, crime: sysText(lang, 'crimes', `${life.prison.crimeId}.name`) })}
        </div>
      )}
    </Sheet>
  )
}
