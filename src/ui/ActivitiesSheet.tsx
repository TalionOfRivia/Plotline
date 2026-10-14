import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGame } from '../state/store'
import { Pill, Row, Section, Sheet } from './Sheet'
import { ACTIVITIES, CRIMES, EDUCATION, sysText } from '../engine/systems'
import { crimeOdds } from '../engine/crime'
import { canEnrollUniversity, gradSchoolsAvailable } from '../engine/school'
import { BUSINESS_KINDS, MAFIA_RANKS, PLATFORMS, canApplyAgent, canApplyAstronaut } from '../engine/special'
import { formatMoney } from './money'
import { EMIGRATE_COST, IVF_COST, LAWSUIT_COST, LICENSES, licenseOdds, type LicenseKey } from '../engine/extras'
import { CountryPicker } from './CountryPicker'
import { CRIME_TARGETS } from '../engine/crime'
import { APPEAL_COST, PRISON_JOBS } from '../engine/prison'
import { DOCTORS } from '../engine/doctors'
import { PRIVATE_SCHOOL_COST, majorsOffered, parentsCanPay } from '../engine/school'

type Page = 'hub' | 'activities' | 'education' | 'crime' | 'special' | 'business' | 'admin' | 'luck' | 'emigrate' | 'prison' | 'doctors' | 'crime_setup'

export function ActivitiesSheet() {
  const { t, i18n } = useTranslation()
  const life = useGame((s) => s.life)!
  const g = useGame()
  const [page, setPage] = useState<Page>('hub')
  const [bizName, setBizName] = useState('')
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [crimeId, setCrimeId] = useState<string | null>(null)
  const [target, setTarget] = useState<string | undefined>()
  const [accomplice, setAccomplice] = useState<string | undefined>()
  const runCrime = (id: string, opts?: { target?: string; accompliceId?: string }) => {
    const r = g.crime(id, opts)
    if (!r) return
    if (r.ok) toast('crime.toast.success', 'good', { text: sysText(lang, 'crimes', `${id}.success`).replace('{{money}}', formatMoney(r.money, lang)) })
    else toast(r.years > 0 ? 'crime.toast.arrested' : 'crime.toast.caught', 'bad', { text: sysText(lang, 'crimes', `${id}.caught`), years: r.years })
  }
  const lang = i18n.language
  const back = () => setPage('hub')
  const toast = (key: string, kind: 'good' | 'bad' | 'info', params?: Record<string, string | number>) => g.setToast({ key, kind, params })

  const LUCK = new Set(['lottery_ticket', 'casino', 'horse_races', 'fight_betting', 'sweepstakes'])
  if (page === 'prison' && life.prison) return (
    <Sheet title={t('prison.title')} emoji="🔒" onBack={back}>
      <div className="bg-card rounded-2xl p-4 mb-3 shadow-sm text-sm">
        <div className="font-bold">{life.prison.deathRow ? t('prison.deathRow') : t('prison.status', { years: life.prison.yearsLeft, crime: sysText(lang, 'crimes', `${life.prison.crimeId}.name`) })}</div>
        <div className="opacity-70 mt-1">{t('prison.served', { n: life.prison.served })}{life.prison.gang ? ` · ${t('prison.inGang')}` : ''}{life.prison.job ? ` · ${t(`prison.jobs.${life.prison.job}`)}` : ''}</div>
      </div>
      <Section title={t('prison.work')}>
        {PRISON_JOBS.map((j) => <Row key={j} emoji={{ laundry: '🧺', kitchen: '🍲', library: '📚', workshop: '🔨' }[j]} title={t(`prison.jobs.${j}`)} sub={t('prison.jobSub')} right={life.prison?.job === j ? '✓' : undefined} onClick={() => g.prisonJob(j)} />)}
      </Section>
      <Section title={t('prison.options')}>
        {!life.prison.gang && <Row emoji="🦂" title={t('prison.joinGang')} sub={t('prison.joinGangSub')} onClick={g.joinGang} />}
        <Row emoji="⚖️" title={t('prison.appeal')} sub={t('prison.appealSub', { money: formatMoney(APPEAL_COST, lang) })} onClick={g.appeal} disabled={life.money < APPEAL_COST} />
        {!life.prison.deathRow && <Row emoji="🏃" title={t('prison.escape')} sub={t('prison.escapeSub')} onClick={g.startEscape} />}
      </Section>
    </Sheet>
  )
  if (page === 'doctors') return (
    <Sheet title={t('doctor.title')} emoji="🩺" onBack={back}>
      {life.flags.ailment && <div className="bg-card rounded-2xl p-3 mb-3 shadow-sm text-sm">🤒 {t('doctor.current', { ailment: t(`health.name.${String(life.flags.ailment)}`) })}</div>}
      {life.flags.depressed && <div className="bg-card rounded-2xl p-3 mb-3 shadow-sm text-sm">🌧️ {t('doctor.depressedHint')}</div>}
      {(['cheap', 'good', 'alternative'] as const).map((k) => (
        <Row key={k} emoji={{ cheap: '🏥', good: '👩‍⚕️', alternative: '🔮' }[k]} title={t(`doctor.kind.${k}`)} sub={<>{t('doctor.reputation')} <span className="inline-block w-20 h-1.5 align-middle rounded-full bg-fg/10 overflow-hidden"><span className="block h-full bg-accent" style={{ width: `${DOCTORS[k].reputation}%` }} /></span></>} right={formatMoney(DOCTORS[k].cost, lang)} onClick={() => g.doctor(k)} />
      ))}
      <Section title={t('doctor.donate')}>
        <Row emoji="🩸" title={t('doctor.blood')} sub={t('doctor.bloodSub')} onClick={() => g.donate('blood')} disabled={life.age < 18} />
        <Row emoji="💉" title={t('doctor.plasma')} sub={t('doctor.plasmaSub')} right="+$60" onClick={() => g.donate('plasma')} disabled={life.age < 18} />
      </Section>
    </Sheet>
  )
  if (page === 'crime_setup' && crimeId) {
    const targets = CRIME_TARGETS[crimeId] ?? []
    const friends = life.people.filter((p) => (p.kind === 'friend' || p.kind === 'sibling') && p.alive && p.age >= 14)
    return (
      <Sheet title={sysText(lang, 'crimes', `${crimeId}.name`)} emoji="🎯" onBack={() => setPage('crime')}>
        {targets.length > 0 && (
          <Section title={t('crime.target')}>
            {targets.map((tg) => <Row key={tg.id} emoji="🎯" title={t(`crime.targets.${tg.id}`)} sub={`${t('crime.odds')} ${tg.odds >= 0 ? '+' : ''}${Math.round(tg.odds * 100)}% · ${t('crime.payout')} ×${tg.payout}`} right={target === tg.id ? '✓' : undefined} onClick={() => setTarget(tg.id)} />)}
          </Section>
        )}
        <Section title={t('crime.accomplice')}>
          <Row emoji="🙅" title={t('crime.alone')} right={!accomplice ? '✓' : undefined} onClick={() => setAccomplice(undefined)} />
          {friends.map((f) => <Row key={f.id} emoji="🤝" title={`${f.firstName} ${f.lastName}`} sub={`🤪 ${f.craziness ?? 50} · ${t('crime.accompliceSub')}`} right={accomplice === f.id ? '✓' : undefined} onClick={() => setAccomplice(f.id)} />)}
        </Section>
        <button onClick={() => { runCrime(crimeId, { target, accompliceId: accomplice }); setPage('crime') }} className="w-full rounded-2xl bg-accent text-on-accent font-bold py-3">{t('crime.go')}</button>
      </Sheet>
    )
  }
  if (page === 'emigrate') return (
    <Sheet title={t('admin.emigrate')} emoji="🌍" onBack={() => setPage('admin')}>
      <p className="text-xs opacity-70 px-1 mb-2">{t('admin.emigrateHint', { money: formatMoney(EMIGRATE_COST, lang) })}</p>
      <CountryPicker value={life.countryCode} onPick={(code) => { g.emigrate(code); setPage('admin') }} />
    </Sheet>
  )
  if (page === 'luck') return (
    <Sheet title={t('act.luck')} emoji="🎰" onBack={back}>
      <p className="text-xs opacity-70 px-1 mb-3">{t('act.luckHint')}</p>
      {ACTIVITIES.filter((a) => LUCK.has(a.id) && life.age >= a.minAge).map((a) => (
        <Row key={a.id} emoji={a.emoji} title={sysText(lang, 'activities', `${a.id}.name`)} sub={sysText(lang, 'activities', `${a.id}.blurb`)}
          right={a.cost ? formatMoney(a.cost, lang) : t('act.free')} disabled={life.money < a.cost || Boolean(life.prison)}
          onClick={() => { const r = g.activity(a.id); if (r) toast(r.key, r.kind, { money: r.money ? formatMoney(r.money, lang) : '' }) }} />
      ))}
    </Sheet>
  )
  if (page === 'admin') return (
    <Sheet title={t('act.admin')} emoji="🗂️" onBack={back}>
      <Section title={t('admin.licenses')}>
        {(Object.keys(LICENSES) as LicenseKey[]).map((k) => (
          <Row key={k} emoji={k === 'has_license' ? '🚗' : k === 'boat_license' ? '⛵' : '✈️'} title={t(`admin.license.${k}`)}
            sub={life.flags[k] ? t('admin.licensed') : `${formatMoney(LICENSES[k].cost, lang)} · ${t('admin.minAge', { n: LICENSES[k].minAge })}`}
            right={life.flags[k] ? '✅' : <Pill tone={licenseOdds(life, k) > 0.5 ? 'good' : 'ink'}>{Math.round(licenseOdds(life, k) * 100)}%</Pill>}
            onClick={life.flags[k] ? undefined : () => g.license(k)} disabled={life.age < LICENSES[k].minAge || life.money < LICENSES[k].cost} />
        ))}
      </Section>
      <Section title={t('admin.legal')}>
        <Row emoji="⚖️" title={t('admin.lawsuit')} sub={t('admin.lawsuitSub', { money: formatMoney(LAWSUIT_COST, lang) })} onClick={g.sue} disabled={life.age < 18 || life.money < LAWSUIT_COST} />
        <Row emoji="📜" title={t('admin.will')} sub={life.will ? t('admin.willOn') : t('admin.willOff')} onClick={g.toggleWill} disabled={life.age < 18} />
      </Section>
      <Section title={t('admin.identity')}>
        <div className="flex gap-1 mb-2">
          {(['opposite', 'same', 'both'] as const).map((a) => (
            <button key={a} onClick={() => g.setAttraction(a)} className={`flex-1 py-2 rounded-xl text-sm font-semibold ${(life.flags.attraction ?? 'opposite') === a ? 'bg-chrome text-chrome-fg' : 'bg-card'}`}>{t(`admin.attraction.${a}`)}</button>
          ))}
        </div>
        <p className="text-xs opacity-70 px-1 mb-2">{t('admin.identityHint')}</p>
      </Section>
      <Section title={t('admin.life')}>
        <Row emoji="🌍" title={t('admin.emigrate')} sub={t('admin.emigrateSub', { money: formatMoney(EMIGRATE_COST, lang) })} onClick={() => setPage('emigrate')} disabled={life.age < 18 || life.money < EMIGRATE_COST} />
        {!confirmEnd
          ? <Row emoji="🏳️" title={t('admin.surrender')} sub={t('admin.surrenderSub')} onClick={() => setConfirmEnd(true)} />
          : <Row emoji="⚠️" title={t('admin.surrenderConfirm')} sub={t('admin.surrenderConfirmSub')} onClick={g.surrender} />}
        <Row emoji="🧬" title={t('admin.fertility')} sub={life.flags.ivf ? t('admin.fertilityOn') : t('admin.fertilitySub', { money: formatMoney(IVF_COST, lang) })} onClick={g.ivf} disabled={life.age < 18 || life.money < IVF_COST || Boolean(life.flags.ivf)} />
      </Section>
    </Sheet>
  )
  if (page === 'activities') return (
    <Sheet title={t('act.mindBody')} emoji="🧘" onBack={back}>
      {ACTIVITIES.filter((a) => !LUCK.has(a.id) && life.age >= a.minAge).map((a) => (
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
        <div className="bg-card rounded-2xl p-4 mb-4 shadow-sm text-sm">
          <div><b>{t(`edu.stage.${ed.stage}`)}</b>{ed.major && <> · {sysText(lang, 'education', `majors.${ed.major}`)}</>}{ed.gradSchool && ed.stage === 'grad' && <> · {sysText(lang, 'education', `gradSchools.${ed.gradSchool}`)}</>}</div>
          {(ed.stage === 'primary' || ed.stage === 'high_school' || ed.stage === 'university' || ed.stage === 'grad') && (
            <div className="mt-2 flex items-center gap-2"><span>{t('edu.grades')}</span>
              <div className="flex-1 h-2 rounded-full bg-fg/10 overflow-hidden"><div className="h-full bg-smarts" style={{ width: `${ed.grades}%` }} /></div>
              <span className="tabular-nums">{Math.round(ed.grades)}</span></div>
          )}
          {ed.degrees.length > 0 && <div className="mt-2 opacity-70">{t('edu.degrees')}: {ed.degrees.map((d) => d.startsWith('grad_') ? sysText(lang, 'education', `gradSchools.${d}`) : t(`edu.${d}`)).join(', ')}</div>}
          {ed.loans > 0 && <div className="mt-1 text-bad">{t('edu.loans')}: {formatMoney(ed.loans, lang)}</div>}
        </div>
        {ed.stage !== 'none' && ed.stage !== 'done' && <Row emoji="📚" title={t('edu.study')} sub={t('edu.studySub')} onClick={g.study} />}
        {(ed.stage === 'primary' || ed.stage === 'high_school') && (
          <>
            <Section title={t('edu.popularity')}>
              <div className="bg-card rounded-2xl p-3 mb-2 shadow-sm text-sm flex items-center gap-2"><span>⭐</span><div className="flex-1 h-2 rounded-full bg-fg/10 overflow-hidden"><div className="h-full bg-happy" style={{ width: `${Number(life.flags.school_popularity ?? 40)}%` }} /></div><span className="tabular-nums">{Math.round(Number(life.flags.school_popularity ?? 40))}</span></div>
              <Row emoji="🎉" title={t('edu.hostParty')} right={formatMoney(200, lang)} onClick={() => g.popularity('host_party')} disabled={life.money < 200} />
              <Row emoji="🙂" title={t('edu.beNice')} onClick={() => g.popularity('be_nice')} />
              <Row emoji="😎" title={t('edu.showOff')} onClick={() => g.popularity('show_off')} />
            </Section>
            <Section title={t('edu.teachers')}>
              {life.teachers.map((tc) => (
                <div key={tc.id} className="bg-card rounded-2xl p-3 mb-2 shadow-sm text-sm">
                  <div className="flex items-center gap-2"><span>👩‍🏫</span><span className="font-semibold flex-1">{t(`edu.subject.${tc.subject}`)}</span><span className="tabular-nums opacity-70">❤️ {Math.round(tc.relationship)}</span></div>
                  <div className="flex gap-1 mt-2">
                    <button onClick={() => g.teacher(tc.id, 'suck_up')} className="flex-1 py-1.5 rounded-xl bg-fg/5 text-xs">{t('edu.suckUp')}</button>
                    <button onClick={() => g.teacher(tc.id, 'ask_help')} className="flex-1 py-1.5 rounded-xl bg-fg/5 text-xs">{t('edu.askHelp')}</button>
                    <button onClick={() => g.teacher(tc.id, 'prank')} className="flex-1 py-1.5 rounded-xl bg-fg/5 text-xs">{t('edu.prankTeacher')}</button>
                  </div>
                </div>
              ))}
            </Section>
            <Row emoji={life.flags.private_school ? '🏫' : '🎩'} title={life.flags.private_school ? t('edu.toPublic') : t('edu.toPrivate')} sub={life.flags.private_school ? t('edu.toPublicSub') : t('edu.toPrivateSub', { money: formatMoney(PRIVATE_SCHOOL_COST, lang) })} onClick={() => g.switchSchool(!life.flags.private_school)} />
          </>
        )}
        {life.age >= 18 && !ed.degrees.includes('high_school') && <Row emoji="📜" title={t('edu.ged')} sub={t('edu.gedSub')} right={formatMoney(150, lang)} onClick={g.ged} disabled={life.money < 150} />}
        {canEnrollUniversity(life) && (
          <Section title={t('edu.enrollUni', { money: formatMoney(EDUCATION.universityCost, lang) })}>
            <p className="text-xs opacity-70 px-1 mb-2">{t('edu.fundingHint', { smarts: EDUCATION.scholarshipMinSmarts })}</p>
            {EDUCATION.majors.filter((m) => majorsOffered(life).includes(m.id)).map((m) => {
              const ok = life.stats.smarts >= m.minSmarts
              const funding = life.stats.smarts >= EDUCATION.scholarshipMinSmarts ? 'scholarship' : parentsCanPay(life) ? 'parents' : life.money >= EDUCATION.universityCost ? 'cash' : 'loan'
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
          onClick={() => { if (CRIME_TARGETS[c.id] || life.people.some((p) => (p.kind === 'friend' || p.kind === 'sibling') && p.alive && p.age >= 14)) { setCrimeId(c.id); setTarget(undefined); setAccomplice(undefined); setPage('crime_setup') } else runCrime(c.id) }} />
      })}
    </Sheet>
  )

  if (page === 'business') return (
    <Sheet title={t('biz.title')} emoji="🏢" onBack={back}>
      {life.business ? (
        <>
          <div className="bg-card rounded-2xl p-4 mb-3 shadow-sm">
            <div className="text-xl font-bold">{life.business.name}</div>
            <div className="text-sm opacity-70">{t(`biz.kind.${life.business.kind}`)} · {t('biz.years', { n: life.business.yearsRunning })}</div>
            <div className="mt-2">{t('biz.value')}: <b>{formatMoney(life.business.value, lang)}</b></div>
          </div>
          <Row emoji="💸" title={t('biz.sell', { money: formatMoney(Math.round(life.business.value * 0.9), lang) })} onClick={g.sellBusiness} />
        </>
      ) : (
        <>
          <input value={bizName} onChange={(e) => setBizName(e.target.value)} placeholder={t('biz.namePlaceholder')} className="w-full rounded-2xl bg-card px-4 py-3 mb-3 shadow-sm outline-none" />
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
        <div className="bg-card rounded-2xl p-3 mb-2 shadow-sm text-sm flex items-center gap-2">
          <span>⭐ {t('fame.level')}</span>
          <div className="flex-1 h-2 rounded-full bg-fg/10 overflow-hidden"><div className="h-full bg-happy" style={{ width: `${life.fame}%` }} /></div>
          <span className="tabular-nums">{Math.round(life.fame)}</span>
        </div>
        {life.age >= 13 && PLATFORMS.map((p) => (
          <Row key={p} emoji={{ photo: '📷', video: '🎬', stream: '🎮', micro: '🐦', podcast: '🎙️', subs: '🔞' }[p]} title={t(`fame.platform.${p}`)} sub={t('fame.followers', { n: (life.social[p] ?? 0).toLocaleString() })} right={t('fame.postBtn')} onClick={() => g.post(p)} disabled={p === 'subs' && life.age < 18} />
        ))}
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
      {life.prison && <Row emoji="🔒" title={t('prison.title')} sub={t('prison.status', { years: life.prison.yearsLeft, crime: sysText(lang, 'crimes', `${life.prison.crimeId}.name`) })} onClick={() => setPage('prison')} />}
      <Row emoji="🩺" title={t('doctor.title')} sub={t('doctor.sub')} onClick={() => setPage('doctors')} />
      <Row emoji="🧘" title={t('act.mindBody')} sub={t('act.mindBodySub')} onClick={() => setPage('activities')} />
      {life.age >= 18 && <Row emoji="🎰" title={t('act.luck')} sub={t('act.luckSub')} onClick={() => setPage('luck')} />}
      {life.age >= 16 && <Row emoji="🗂️" title={t('act.admin')} sub={t('act.adminSub')} onClick={() => setPage('admin')} />}
      <Row emoji="🎓" title={t('act.education')} sub={t(`edu.stage.${life.education.stage}`)} onClick={() => setPage('education')} />
      {life.age >= 12 && <Row emoji="🚔" title={t('act.crime')} sub={t('act.crimeSub')} onClick={() => setPage('crime')} />}
      <Row emoji="🌟" title={t('act.special')} sub={t('act.specialSub')} onClick={() => setPage('special')} />
      <Row emoji="🏆" title={t('challenge.title')} sub={t('challenge.menuSub', { done: g.completedChallenges.length })} onClick={() => g.openSheet('challenges')} />
      {life.prison && (
        <div className="bg-card rounded-2xl p-4 mt-2 shadow-sm text-sm">
          🔒 {t('prison.status', { years: life.prison.yearsLeft, crime: sysText(lang, 'crimes', `${life.prison.crimeId}.name`) })}
        </div>
      )}
    </Sheet>
  )
}
