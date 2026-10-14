import type { JobTrack, Life } from './types'
import type { Rng } from './rng'
import { JOB_BY_ID, JOB_TRACKS } from './systems'
import { clamp, log, use, used } from './util'
import { jobTitleKey, promote } from './effects'

const TAX_BRACKETS: [number, number][] = [[12_000, 0.1], [45_000, 0.2], [95_000, 0.3], [180_000, 0.4], [Infinity, 0.47]]

export function taxOn(income: number) {
  let tax = 0, prev = 0
  for (const [cap, rate] of TAX_BRACKETS) {
    const slice = Math.min(income, cap) - prev
    if (slice <= 0) break
    tax += slice * rate
    prev = cap
  }
  return Math.round(tax)
}

const FAME_TRACKS = new Set(['actor', 'musician', 'music_producer', 'model', 'movie_director', 'influencer', 'professional_athlete', 'politician', 'fighter'])

export function meetsRequirements(track: JobTrack, life: Life): boolean {
  const r = track.requires ?? {}
  const minAge = r.minAge ?? 18
  if (life.age < minAge) return false
  const ed = r.education ?? 'none'
  if (ed === 'high_school' && !life.education.degrees.includes('high_school')) return false
  if (ed === 'university' && !life.education.degrees.includes('university')) return false
  if (ed.startsWith('grad_') && !life.education.degrees.includes(ed)) return false
  if (r.majors?.length && ed === 'university' && (!life.education.major || !r.majors.includes(life.education.major))) return false
  if (r.minSmarts && life.stats.smarts < r.minSmarts) return false
  if (r.minLooks && life.stats.looks < r.minLooks) return false
  if (r.minHealth && life.stats.health < r.minHealth) return false
  return true
}

/** The job board: a stable, seeded subset of tracks for this year. */
export function refreshJobBoard(life: Life, rng: Rng) {
  const teen = life.age < 18
  const pool = JOB_TRACKS.filter((t) => {
    const minAge = t.requires?.minAge ?? 18
    return teen ? minAge < 18 : true
  })
  const n = teen ? 4 : 8
  const picks = new Set<string>()
  let guard = 0
  while (picks.size < Math.min(n, pool.length) && guard++ < 100) picks.add(rng.pick(pool).id)
  life.jobBoard = [...picks]
}

/** Interview odds (0..1), shown to the player before applying. */
export function interviewOdds(track: JobTrack, life: Life): number {
  if (!meetsRequirements(track, life)) return 0
  let p = 0.32 + (life.stats.smarts - 50) / 220 + (life.stats.looks - 50) / 500
  if (FAME_TRACKS.has(track.id)) p *= 0.45
  if (life.flags.ever_worked) p += 0.1
  if (life.convictions > 0) p -= 0.15 * Math.min(life.convictions, 3)
  if (life.flags.just_fired) p -= 0.1
  if (life.education.grades >= 85 && life.education.degrees.length) p += 0.1
  if (life.flags.recruited_for === track.id) p = Math.min(0.95, p * 2)
  return clamp(p, 0.05, 0.95)
}

export function applyForJob(life: Life, trackId: string, rng: Rng): 'hired' | 'rejected' | 'ineligible' {
  const track = JOB_BY_ID[trackId]
  if (!track || !meetsRequirements(track, life) || life.prison) return 'ineligible'
  if (!rng.chance(interviewOdds(track, life))) {
    log(life, 'bad', 'work.rejected', { track: trackId })
    return 'rejected'
  }
  life.job = { trackId, rung: 0, yearsInTrack: 0, performance: 50 + rng.int(-5, 10), salary: track.ladder[0].salary }
  life.flags.ever_worked = true
  delete life.flags.just_fired
  life.retired = false
  life.stats.happiness = clamp(life.stats.happiness + 5)
  log(life, 'good', 'work.hired', { title: jobTitleKey(life) })
  return 'hired'
}

export const RECRUITER_FEE = 1_600
/** The recruiter finds a track you qualify for and doubles your interview odds for it this year. */
export function recruiter(life: Life, rng: Rng): string | null {
  if (life.age < 18 || life.money < RECRUITER_FEE || life.prison || used(life, 'recruiter') >= 1) return null
  use(life, 'recruiter')
  life.money -= RECRUITER_FEE
  const ok = JOB_TRACKS.filter((t) => meetsRequirements(t, life) && !FAME_TRACKS.has(t.id) && (t.requires?.minAge ?? 18) >= 18)
  if (!ok.length) return null
  const pick = ok.sort((a, b) => b.ladder[0].salary - a.ladder[0].salary)[rng.int(0, Math.min(2, ok.length - 1))]
  if (!life.jobBoard.includes(pick.id)) life.jobBoard.unshift(pick.id)
  life.flags.recruited_for = pick.id
  return pick.id
}

export function quitJob(life: Life) {
  if (!life.job) return
  log(life, 'info', 'work.quitLog', { title: jobTitleKey(life) })
  life.job = null
}

export function workHarder(life: Life) {
  if (!life.job || used(life, 'work_harder') >= 1) return
  use(life, 'work_harder')
  life.job.performance = clamp(life.job.performance + 10)
  life.stats.happiness = clamp(life.stats.happiness - 3)
  life.stats.health = clamp(life.stats.health - 1)
}

export function retire(life: Life) {
  if (!life.job || life.age < 60) return
  life.pension = Math.round(life.job.salary * 0.4)
  log(life, 'milestone', 'work.retired', { title: jobTitleKey(life), pension: life.pension })
  life.job = null
  life.retired = true
}

/** Yearly: pay salary, drift performance, promotions, firings. */
export function workYear(life: Life, rng: Rng) {
  if (life.retired && life.pension) {
    life.money += life.pension
  }
  const job = life.job
  if (!job) return
  const track = JOB_BY_ID[job.trackId]
  if (!track) { life.job = null; return }
  if (life.prison) { log(life, 'bad', 'work.firedPrison'); life.job = null; return }

  const gross = job.salary
  const net = gross - taxOn(gross)
  // half of take-home goes to lifestyle spending that scales with income
  life.money += Math.round(net * 0.5)
  job.yearsInTrack++

  // performance drifts toward a baseline set by smarts & health, with noise
  const base = 40 + life.stats.smarts * 0.25 + life.stats.health * 0.15
  job.performance = clamp(job.performance + (base - job.performance) * 0.25 + rng.int(-8, 8))

  // promotion
  const next = track.ladder[job.rung + 1]
  if (next && job.yearsInTrack >= next.minYears - track.ladder[job.rung].minYears) {
    const p = job.performance < 55 ? 0.02 : 0.1 + (job.performance - 55) / 180
    if (rng.chance(clamp(p, 0.02, 0.45))) promote(life)
  } else if (rng.chance(0.25) && job.performance > 60) {
    job.salary = Math.round(job.salary * 1.03)
  }

  // firing
  if (job.performance < 25 && rng.chance(0.5)) {
    log(life, 'bad', 'work.firedPerformance', { title: jobTitleKey(life) })
    life.job = null
    life.flags.just_fired = true
    life.stats.happiness = clamp(life.stats.happiness - 12)
  } else if (rng.chance(0.03)) {
    log(life, 'bad', 'work.laidOff', { title: jobTitleKey(life) })
    life.job = null
    life.stats.happiness = clamp(life.stats.happiness - 8)
  }
  // headhunters and referrals: a better (or worse) offer lands on your desk
  if (life.age >= 20 && rng.chance(0.08)) {
    const options = JOB_TRACKS.filter((t) => meetsRequirements(t, life) && t.id !== job.trackId && !FAME_TRACKS.has(t.id) && (t.requires?.minAge ?? 18) >= 18)
    if (options.length) {
      const t = rng.pick(options)
      const rung = Math.min(t.ladder.length - 1, rng.int(0, 1))
      life.flags.offer_track = t.id
      life.flags.offer_rung = rung
      life.flags.offer_salary = Math.round(t.ladder[rung].salary * (0.9 + rng.float() * 0.4))
      life.pending = { eventId: 'sys_job_offer' }
      life.seenEvents.push('sys_job_offer')
    }
  }
  // fighters get hurt
  if (life.job?.trackId === 'fighter' && rng.chance(0.25)) { life.stats.health = clamp(life.stats.health - rng.int(4, 14)); life.stats.looks = clamp(life.stats.looks - rng.int(0, 3)); log(life, 'bad', 'work.fightInjury') }
  // cartel work: the police are always a few steps behind
  if (life.job?.trackId === 'dealer' && rng.chance(0.08 + job.rung * 0.02)) {
    life.convictions++
    life.job = null
    life.prison = { yearsLeft: rng.int(2, 6) + job.rung * 2, served: 0, crimeId: 'drug_dealing' }
    life.stats.happiness = clamp(life.stats.happiness - 20)
    log(life, 'bad', 'work.busted')
    return
  }
  // forced retirement
  if (life.job && life.age >= 70 && rng.chance(0.3)) retire(life)
}
