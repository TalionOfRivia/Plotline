import { useTranslation } from 'react-i18next'
import { useGame } from '../state/store'
import { Pill, Row, Section, Sheet } from './Sheet'
import { JOB_BY_ID, sysText } from '../engine/systems'
import { interviewOdds, meetsRequirements, taxOn } from '../engine/jobs'
import { formatMoney } from './money'
import { gigPay } from '../engine/extras'
import { RECRUITER_FEE } from '../engine/jobs'

export function JobSheet() {
  const { t, i18n } = useTranslation()
  const life = useGame((s) => s.life)!
  const { applyJob, quitJob, workHarder, retire, gig, recruiter, setHours, reportHR, socialize } = useGame()
  const lang = i18n.language
  const job = life.job
  const track = job ? JOB_BY_ID[job.trackId] : null

  return (
    <Sheet title={t('nav.job')} emoji="💼">
      {job && track ? (
        <Section title={t('work.current')}>
          <div className="bg-card rounded-2xl p-4 mb-2 shadow-sm">
            <div className="text-2xl">{track.emoji} <b>{sysText(lang, 'jobs', `tracks.${track.id}.ladder.${track.ladder[job.rung].id}`)}</b></div>
            <div className="text-sm opacity-70">{sysText(lang, 'jobs', `tracks.${track.id}.name`)} · {t('work.years', { n: job.yearsInTrack })}</div>
            <div className="mt-2 text-sm">
              {t('work.salary')}: <b>{formatMoney(job.salary, lang)}</b> <span className="opacity-60">({t('work.afterTax', { money: formatMoney(job.salary - taxOn(job.salary), lang) })})</span>
            </div>
            <div className="mt-2 text-sm flex items-center gap-2">
              <span>{t('work.performance')}</span>
              <div className="flex-1 h-2 rounded-full bg-fg/10 overflow-hidden"><div className="h-full bg-accent" style={{ width: `${job.performance}%` }} /></div>
              <span className="tabular-nums">{Math.round(job.performance)}</span>
            </div>
            <div className="mt-1 text-sm flex items-center gap-2">
              <span>{t('work.stress')}</span>
              <div className="flex-1 h-2 rounded-full bg-fg/10 overflow-hidden"><div className="h-full bg-health" style={{ width: `${job.stress ?? 25}%` }} /></div>
              <span className="tabular-nums">{Math.round(job.stress ?? 25)}</span>
            </div>
            <div className="mt-1 text-sm flex items-center gap-2">
              <span>{t('work.popularity')}</span>
              <div className="flex-1 h-2 rounded-full bg-fg/10 overflow-hidden"><div className="h-full bg-happy" style={{ width: `${job.popularity ?? 50}%` }} /></div>
              <span className="tabular-nums">{Math.round(job.popularity ?? 50)}</span>
            </div>
            <div className="mt-2 flex gap-1">
              {([20, 40, 50] as const).map((h) => (
                <button key={h} onClick={() => setHours(h)} className={`flex-1 py-1.5 rounded-xl text-xs font-semibold ${(job.hours ?? 40) === h ? 'bg-chrome text-chrome-fg' : 'bg-fg/5'}`}>{t(`work.hours.${h}`)}</button>
              ))}
            </div>
            {track.ladder[job.rung + 1] && (
              <div className="mt-1 text-xs opacity-60">{t('work.next', { title: sysText(lang, 'jobs', `tracks.${track.id}.ladder.${track.ladder[job.rung + 1].id}`), money: formatMoney(track.ladder[job.rung + 1].salary, lang) })}</div>
            )}
          </div>
          <Row emoji="💪" title={t('work.harder')} sub={t('work.harderSub')} onClick={workHarder} />
          <Row emoji="☕" title={t('work.socialize')} sub={t('work.socializeSub')} onClick={socialize} />
          <Row emoji="📋" title={t('work.hr')} sub={t('work.hrSub')} onClick={reportHR} />
          {life.age >= 60 && <Row emoji="🏖️" title={t('work.retire')} sub={t('work.retireSub', { money: formatMoney(Math.round(job.salary * 0.4), lang) })} onClick={retire} />}
          <Row emoji="🚪" title={t('work.quit')} onClick={quitJob} />
        </Section>
      ) : (
        <div className="bg-card rounded-2xl p-4 mb-4 shadow-sm text-sm">
          {life.retired ? t('work.retiredStatus', { money: formatMoney(life.pension, lang) }) : life.prison ? t('work.inPrison') : t('work.unemployed')}
        </div>
      )}

      {life.gigs.length > 0 && (
        <Section title={t('gig.title')}>
          {life.gigs.map((id) => (
            <Row key={id} emoji="🧢" title={t(`gig.name.${id}`)} sub={t('gig.sub')} right={formatMoney(gigPay(id, life), lang)} onClick={() => gig(id)} />
          ))}
        </Section>
      )}
      {!life.prison && !job && life.age >= 18 && <Row emoji="📞" title={t('work.recruiter')} sub={t('work.recruiterSub', { money: formatMoney(RECRUITER_FEE, lang) })} onClick={recruiter} disabled={life.money < RECRUITER_FEE} />}
      {!life.prison && (
        <Section title={t('work.board')}>
          {life.jobBoard.map((id) => {
            const tr = JOB_BY_ID[id]
            if (!tr) return null
            const ok = meetsRequirements(tr, life)
            const odds = interviewOdds(tr, life)
            const req = tr.requires ?? {}
            const reqText = [
              req.education && req.education !== 'none' ? t(`edu.${req.education}`) : null,
              req.minSmarts ? `🧠${req.minSmarts}` : null,
              req.minLooks ? `✨${req.minLooks}` : null,
              req.minHealth ? `❤️${req.minHealth}` : null,
            ].filter(Boolean).join(' · ')
            return (
              <Row
                key={id}
                emoji={tr.emoji}
                title={sysText(lang, 'jobs', `tracks.${id}.ladder.${tr.ladder[0].id}`)}
                sub={<>{formatMoney(tr.ladder[0].salary, lang)}/{t('work.yr')} {reqText && <span>· {reqText}</span>}</>}
                right={ok ? <Pill tone={odds > 0.5 ? 'good' : 'ink'}>{Math.round(odds * 100)}%</Pill> : <Pill tone="bad">{t('work.notQualified')}</Pill>}
                onClick={ok && !job ? () => applyJob(id) : undefined}
              />
            )
          })}
          {job && <p className="text-xs opacity-60 px-1">{t('work.quitFirst')}</p>}
        </Section>
      )}
    </Sheet>
  )
}
