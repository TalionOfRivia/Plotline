import type { Life } from './types'
import type { Rng } from './rng'
import { CRIMES } from './systems'
import { clamp, log, use, used } from './util'
import { arrest } from './prison'
export { prisonYear, imprison } from './prison'

export function crimeOdds(crimeId: string, life: Life): number {
  const c = CRIMES.find((x) => x.id === crimeId)
  if (!c || life.age < c.minAge) return 0
  if (c.minSmarts && life.stats.smarts < c.minSmarts) return 0.05
  let p = c.baseSuccess + (life.stats.smarts - 50) / 250 - Math.min(life.convictions, 4) * 0.05
  if (life.mafia) p += 0.1
  return clamp(p, 0.03, 0.95)
}

export type CrimeResult = { ok: true; money: number } | { ok: false; years: number }

export const CRIME_TARGETS: Record<string, { id: string; odds: number; payout: number }[]> = {
  burglary: [{ id: 'bungalow', odds: 0.15, payout: 0.5 }, { id: 'suburban_home', odds: 0, payout: 1 }, { id: 'mansion', odds: -0.2, payout: 3 }],
  car_theft: [{ id: 'old_sedan', odds: 0.15, payout: 0.4 }, { id: 'family_suv', odds: 0, payout: 1 }, { id: 'sports_car', odds: -0.2, payout: 2.5 }],
  hacking: [{ id: 'small_shop', odds: 0.1, payout: 0.5 }, { id: 'bank', odds: -0.25, payout: 3 }, { id: 'ex_partner', odds: 0.2, payout: 0.1 }],
  bank_robbery: [{ id: 'credit_union', odds: 0.1, payout: 0.6 }, { id: 'downtown_branch', odds: 0, payout: 1 }, { id: 'central_vault', odds: -0.25, payout: 3 }],
  murder: [{ id: 'stranger', odds: 0.05, payout: 1 }, { id: 'enemy', odds: 0, payout: 1 }, { id: 'rival', odds: -0.05, payout: 1 }],
}

export function commitCrime(life: Life, crimeId: string, rng: Rng, opts: { target?: string; accompliceId?: string } = {}): CrimeResult | null {
  const c = CRIMES.find((x) => x.id === crimeId)
  if (!c || life.age < c.minAge || life.prison || used(life, 'crime') >= 2) return null
  if (crimeId === 'embezzle' && !life.job) return null
  use(life, 'crime')
  life.karma = clamp(life.karma + c.karma, -100, 100)
  const target = CRIME_TARGETS[crimeId]?.find((t) => t.id === opts.target)
  const acc = opts.accompliceId ? life.people.find((p) => p.id === opts.accompliceId && p.alive) : undefined
  let odds = crimeOdds(crimeId, life) + (target?.odds ?? 0)
  if (acc) odds += ((acc.craziness ?? 50) - 50) / 250 + 0.05
  if (life.flags.probation) odds -= 0.15
  if (rng.chance(clamp(odds, 0.03, 0.95))) {
    const money = Math.round(rng.int(c.payout[0], c.payout[1]) * (target?.payout ?? 1) * (acc ? 0.7 : 1))
    if (acc) { acc.relationship = clamp(acc.relationship + 5); if (rng.chance(0.15)) { acc.enemy = true; acc.relationship = clamp(acc.relationship - 40); log(life, 'bad', 'crime.accompliceRatted', { name: acc.firstName }) } }
    life.flags.count_crimes_ok = (Number(life.flags.count_crimes_ok) || 0) + 1
    if (['shoplift', 'pickpocket', 'burglary', 'car_theft', 'porch_pirate'].includes(crimeId)) life.flags.count_theft = (Number(life.flags.count_theft) || 0) + 1
    life.money += money
    life.crimes++
    if (c.flags) Object.assign(life.flags, c.flags)
    log(life, 'info', 'crime.success', { crime: crimeId, money })
    return { ok: true, money }
  }
  const years = rng.int(c.sentenceYears[0], c.sentenceYears[1]) + Math.min(life.convictions, 5) + (life.flags.probation ? 1 : 0)
  if (c.flags) Object.assign(life.flags, c.flags)
  if (years <= 0) {
    life.convictions++
    const fine = Math.round(rng.int(200, 2000))
    life.money -= fine
    log(life, 'bad', 'crime.fined', { crime: crimeId, money: fine })
    return { ok: false, years: 0 }
  }
  arrest(life, crimeId, years)
  return { ok: false, years }
}
