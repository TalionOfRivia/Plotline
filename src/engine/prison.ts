// Prison depth: lawyers & pleas at arrest, prison jobs, gangs, appeals, the escape maze, probation, death row.
import type { Life } from './types'
import type { Rng } from './rng'
import { clamp, log, use, used } from './util'
import { release } from './effects'

export type LawyerChoice = 'plead_guilty' | 'public_defender' | 'hired_lawyer' | 'top_lawyer'
export const LAWYER_COST: Record<LawyerChoice, number> = { plead_guilty: 0, public_defender: 0, hired_lawyer: 5_000, top_lawyer: 25_000 }
export const ACQUIT_ODDS: Record<LawyerChoice, number> = { plead_guilty: 0, public_defender: 0.3, hired_lawyer: 0.5, top_lawyer: 0.75 }

/** Called when a crime fails: stash the charge and raise the arrest card. */
export function arrest(life: Life, crimeId: string, years: number) {
  life.flags.charge_crime = crimeId
  life.flags.charge_years = years
  life.pending = { eventId: 'sys_arrest' }
  life.seenEvents.push('sys_arrest')
}

/** Resolve the arrest card. Returns what happened for the toast. */
export function resolveArrest(life: Life, choice: LawyerChoice, rng: Rng): 'acquitted' | 'convicted' | 'plea' {
  const crimeId = String(life.flags.charge_crime ?? 'crime')
  let years = Number(life.flags.charge_years) || 1
  delete life.flags.charge_crime; delete life.flags.charge_years
  const cost = LAWYER_COST[choice]
  life.money -= cost // unpaid fees become debt
  const smartsBonus = (life.stats.smarts - 50) / 500
  if (choice !== 'plead_guilty' && rng.chance(clamp(ACQUIT_ODDS[choice] + smartsBonus, 0.05, 0.95))) {
    log(life, 'good', 'crime.acquitted', { crime: crimeId })
    return 'acquitted'
  }
  if (choice === 'plead_guilty') years = Math.max(1, Math.round(years * 0.6))
  life.convictions++
  if (crimeId === 'murder' && rng.chance(0.4)) {
    imprison(life, crimeId, 99)
    life.prison!.deathRow = true
    log(life, 'bad', 'crime.deathRow')
    return 'convicted'
  }
  imprison(life, crimeId, years)
  return choice === 'plead_guilty' ? 'plea' : 'convicted'
}

export function imprison(life: Life, crimeId: string, years: number) {
  life.prison = { yearsLeft: years, served: 0, crimeId }
  if (life.job) life.job = null
  life.stats.happiness = clamp(life.stats.happiness - 20)
  log(life, 'bad', 'crime.sentenced', { crime: crimeId, years })
}

// ---- inside -------------------------------------------------------------------

export const PRISON_JOBS = ['laundry', 'kitchen', 'library', 'workshop'] as const
export type PrisonJob = (typeof PRISON_JOBS)[number]

export function takePrisonJob(life: Life, job: PrisonJob) {
  if (!life.prison) return
  life.prison.job = job
  life.flags.prison_job = true
}

export function joinGang(life: Life, rng: Rng): boolean {
  if (!life.prison || life.prison.gang) return false
  if (!rng.chance(0.7)) { life.stats.health = clamp(life.stats.health - 8); log(life, 'bad', 'prison.gangRejected'); return false }
  life.prison.gang = true
  life.flags.gang_member = true
  life.karma = clamp(life.karma - 8, -100, 100)
  log(life, 'info', 'prison.gangJoined')
  return true
}

export const APPEAL_COST = 3_000
export function appeal(life: Life, rng: Rng): boolean {
  if (!life.prison || life.money < APPEAL_COST || used(life, 'appeal') >= 1) return false
  use(life, 'appeal')
  life.money -= APPEAL_COST
  const p = 0.2 + (life.stats.smarts - 50) / 400
  if (rng.chance(clamp(p, 0.05, 0.6))) {
    if (life.prison.deathRow) { life.prison.deathRow = false; life.prison.yearsLeft = 25; log(life, 'good', 'prison.commuted') }
    else { const cut = Math.max(1, Math.round(life.prison.yearsLeft * 0.3)); life.prison.yearsLeft -= cut; log(life, 'good', 'prison.appealWon', { years: cut }) }
    if (life.prison.yearsLeft <= 0) { log(life, 'good', 'prison.released'); release(life) }
    return true
  }
  log(life, 'bad', 'prison.appealLost')
  return false
}

/** Result of the escape maze mini-game. */
export function escapeResult(life: Life, won: boolean) {
  if (!life.prison) return
  if (won) { life.prison = null; life.flags.escaped_prison = true; life.flags.fugitive = true; log(life, 'info', 'prison.escaped') }
  else { life.prison.yearsLeft += 2; life.stats.health = clamp(life.stats.health - 10); log(life, 'bad', 'prison.escapeFailed') }
}

/** Yearly prison tick (replaces the old one). */
export function prisonYear(life: Life, rng: Rng) {
  // probation: a couple of years of being watched
  if (life.flags.probation) {
    life.flags.probation = Number(life.flags.probation) - 1
    if (Number(life.flags.probation) <= 0) { delete life.flags.probation; log(life, 'info', 'prison.probationOver') }
  }
  if (life.flags.fugitive && !life.prison) {
    if (rng.chance(0.15)) { delete life.flags.fugitive; imprison(life, 'escape', rng.int(3, 8)); log(life, 'bad', 'prison.recaptured') }
    return
  }
  const pr = life.prison
  if (!pr) return
  pr.served++
  if (pr.deathRow) {
    life.stats.happiness = clamp(life.stats.happiness - rng.int(3, 8))
    if (pr.served >= 8 && rng.chance(0.12)) { life.alive = false; life.causeOfDeath = 'death.executed'; life.diary.push({ age: life.age, kind: 'death', text: 'death.executed' }) }
    return
  }
  pr.yearsLeft--
  if (pr.job) { life.money += 1_200; life.stats.happiness = clamp(life.stats.happiness + 2); life.stats.smarts = clamp(life.stats.smarts + (pr.job === 'library' ? 2 : 0)) }
  life.stats.happiness = clamp(life.stats.happiness - rng.int(1, 4))
  life.stats.health = clamp(life.stats.health - rng.int(0, 2))
  if (!pr.gang && rng.chance(0.12)) { life.stats.health = clamp(life.stats.health - rng.int(5, 15)); log(life, 'bad', 'prison.beaten') }
  if (pr.gang && rng.chance(0.06)) { pr.yearsLeft += 1; log(life, 'bad', 'prison.gangTrouble') }
  if (pr.yearsLeft <= 0) {
    log(life, 'good', 'prison.released')
    release(life)
    life.flags.probation = 2
    delete life.flags.prison_job; delete life.flags.gang_member
  }
}
