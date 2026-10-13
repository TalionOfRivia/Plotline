import type { Life } from './types'
import type { Rng } from './rng'
import { CRIMES } from './systems'
import { clamp, log } from './util'
import { release } from './effects'

export function crimeOdds(crimeId: string, life: Life): number {
  const c = CRIMES.find((x) => x.id === crimeId)
  if (!c || life.age < c.minAge) return 0
  if (c.minSmarts && life.stats.smarts < c.minSmarts) return 0.05
  let p = c.baseSuccess + (life.stats.smarts - 50) / 250 - Math.min(life.convictions, 4) * 0.05
  if (life.mafia) p += 0.1
  return clamp(p, 0.03, 0.95)
}

export type CrimeResult = { ok: true; money: number } | { ok: false; years: number }

export function commitCrime(life: Life, crimeId: string, rng: Rng): CrimeResult | null {
  const c = CRIMES.find((x) => x.id === crimeId)
  if (!c || life.age < c.minAge || life.prison) return null
  life.karma = clamp(life.karma + c.karma, -100, 100)
  if (rng.chance(crimeOdds(crimeId, life))) {
    const money = rng.int(c.payout[0], c.payout[1])
    life.money += money
    life.crimes++
    if (c.flags) Object.assign(life.flags, c.flags)
    log(life, 'info', 'crime.success', { crime: crimeId, money })
    return { ok: true, money }
  }
  const years = rng.int(c.sentenceYears[0], c.sentenceYears[1])
  life.convictions++
  if (c.flags) Object.assign(life.flags, c.flags)
  if (years <= 0) {
    const fine = Math.round(rng.int(200, 2000))
    life.money -= fine
    log(life, 'bad', 'crime.fined', { crime: crimeId, money: fine })
    return { ok: false, years: 0 }
  }
  imprison(life, crimeId, years)
  return { ok: false, years }
}

export function imprison(life: Life, crimeId: string, years: number) {
  life.prison = { yearsLeft: years, served: 0, crimeId }
  if (life.job) life.job = null
  life.stats.happiness = clamp(life.stats.happiness - 20)
  log(life, 'bad', 'crime.sentenced', { crime: crimeId, years })
}

/** Yearly prison tick. */
export function prisonYear(life: Life, rng: Rng) {
  if (life.flags.fugitive && !life.prison) {
    if (rng.chance(0.15)) { delete life.flags.fugitive; imprison(life, 'escape', rng.int(3, 8)); log(life, 'bad', 'prison.recaptured') }
    return
  }
  const pr = life.prison
  if (!pr) return
  pr.yearsLeft--
  pr.served++
  life.stats.happiness = clamp(life.stats.happiness - rng.int(1, 4))
  life.stats.health = clamp(life.stats.health - rng.int(0, 2))
  if (pr.yearsLeft <= 0) {
    log(life, 'good', 'prison.released')
    release(life)
  }
}
