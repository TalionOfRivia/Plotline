import type { JobTrack, Life } from './types'
import type { Rng } from './rng'
import { JOB_BY_ID, JOB_TRACKS } from './systems'
import { clamp, log } from './util'
import { jobTitleKey, promote } from './effects'

const TAX_BRACKETS: [number, number][] = [[10_000, 0], [40_000, 0.12], [90_000, 0.22], [180_000, 0.3], [Infinity, 0.37]]

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
  let p = 0.45 + (life.stats.smarts - 50) / 200 + (life.stats.looks - 50) / 400
  if (life.flags.ever_worked) p += 0.1
  if (life.convictions > 0) p -= 0.15 * Math.min(life.convictions, 3)
  if (life.flags.just_fired) p -= 0.1
  if (life.education.grades >= 85 && life.education.degrees.length) p += 0.1
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

export function quitJob(life: Life) {
  if (!life.job) return
  log(life, 'info', 'work.quitLog', { title: jobTitleKey(life) })
  life.job = null
}

export function workHarder(life: Life) {
  if (!life.job) return
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
  // 35% of take-home goes to living expenses that scale with lifestyle
  life.money += Math.round(net * 0.65)
  job.yearsInTrack++

  // performance drifts toward a baseline set by smarts & health, with noise
  const base = 40 + life.stats.smarts * 0.25 + life.stats.health * 0.15
  job.performance = clamp(job.performance + (base - job.performance) * 0.25 + rng.int(-8, 8))

  // promotion
  const next = track.ladder[job.rung + 1]
  if (next && job.yearsInTrack >= next.minYears - track.ladder[job.rung].minYears) {
    const p = 0.15 + (job.performance - 50) / 150
    if (rng.chance(clamp(p, 0.02, 0.8))) promote(life)
  } else if (rng.chance(0.25) && job.performance > 60) {
    job.salary = Math.round(job.salary * 1.03)
  }

  // firing
  if (job.performance < 25 && rng.chance(0.5)) {
    log(life, 'bad', 'work.firedPerformance', { title: jobTitleKey(life) })
    life.job = null
    life.flags.just_fired = true
    life.stats.happiness = clamp(life.stats.happiness - 12)
  } else if (rng.chance(0.02)) {
    log(life, 'bad', 'work.laidOff', { title: jobTitleKey(life) })
    life.job = null
    life.stats.happiness = clamp(life.stats.happiness - 8)
  }
  // forced retirement
  if (life.job && life.age >= 70 && rng.chance(0.3)) retire(life)
}
