// Military service: branches, ranks, deployments (resolved by the minesweeper mini-game), conscription.
import type { Life } from './types'
import type { Rng } from './rng'
import { clamp, log } from './util'
import { COUNTRY_BY_CODE } from './people'

export const BRANCHES = ['army', 'navy', 'air_force', 'marines'] as const
export type Branch = (typeof BRANCHES)[number]
export const RANKS = ['private', 'corporal', 'sergeant', 'lieutenant', 'captain', 'major', 'colonel', 'general']
const PAY = [28_000, 34_000, 42_000, 58_000, 72_000, 90_000, 115_000, 150_000]

/** Countries with mandatory service at 18. */
export const CONSCRIPTION = new Set(['IL', 'KR', 'SG', 'CH', 'NO', 'FI', 'SE', 'DK', 'AT', 'GR', 'TR', 'BR', 'RU', 'IR', 'EG', 'TH', 'VN', 'TW', 'CY', 'KP', 'SY', 'ER', 'UA', 'MX', 'CO', 'KW', 'QA', 'AE', 'DZ', 'MA', 'TN'])

export function canEnlist(life: Life) {
  return life.age >= 18 && life.age <= 35 && !life.military && !life.prison && life.stats.health >= 50
}

export function enlist(life: Life, branch: Branch, conscripted = false): boolean {
  if (!canEnlist(life) && !conscripted) return false
  life.military = { branch, rank: 0, years: 0 }
  life.flags.military = true
  if (conscripted) life.flags.conscripted = true
  if (life.job) life.job = null
  log(life, 'milestone', 'military.enlisted', { branch })
  return true
}

export function discharge(life: Life, honourable = true) {
  if (!life.military) return
  log(life, honourable ? 'milestone' : 'bad', honourable ? 'military.discharged' : 'military.dishonourable', { rank: RANKS[life.military.rank] })
  life.flags.veteran = true
  if (life.military.years >= 10) life.flags.veteran_long = true
  life.military = null
  delete life.flags.military; delete life.flags.deployed; delete life.flags.military_officer
}

/** Yearly tick. May raise the deployment card. */
export function militaryYear(life: Life, rng: Rng) {
  const m = life.military
  if (!m) {
    // conscription at 18
    if (life.age === 18 && CONSCRIPTION.has(life.countryCode) && !life.flags.conscription_done && !life.prison) {
      life.flags.conscription_done = true
      life.pending = { eventId: 'sys_conscription' }
      life.seenEvents.push('sys_conscription')
    }
    return
  }
  m.years++
  life.money += PAY[m.rank] - Math.round(PAY[m.rank] * 0.18)
  delete life.flags.deployed
  if (m.rank < RANKS.length - 1 && rng.chance(0.2 + (life.stats.smarts - 50) / 400 + (life.flags.medal ? 0.1 : 0))) {
    m.rank++
    if (m.rank >= 3) life.flags.military_officer = true
    log(life, 'good', 'military.promoted', { rank: RANKS[m.rank] })
  }
  if (life.flags.conscripted && m.years >= 2) { delete life.flags.conscripted; log(life, 'info', 'military.serviceDone') }
  else if (!life.pending && rng.chance(0.3)) {
    life.flags.deployed = true
    life.pending = { eventId: 'sys_deployment' }
    life.seenEvents.push('sys_deployment')
  }
  life.stats.health = clamp(life.stats.health + 1)
}

/** Result of the minesweeper mini-game during a deployment. */
export function deploymentResult(life: Life, cleared: number, total: number, hitMine: boolean, rng: Rng) {
  if (hitMine) {
    if (rng.chance(0.25)) { life.alive = false; life.causeOfDeath = 'death.killed_in_action'; life.diary.push({ age: life.age, kind: 'death', text: 'death.killed_in_action' }); return 'killed' }
    life.stats.health = clamp(life.stats.health - rng.int(20, 40))
    life.stats.happiness = clamp(life.stats.happiness - 10)
    log(life, 'bad', 'military.wounded')
    return 'wounded'
  }
  const ratio = cleared / Math.max(1, total)
  if (ratio >= 1) { life.flags.medal = true; life.fame = clamp(life.fame + 5); life.karma = clamp(life.karma + 5, -100, 100); life.stats.happiness = clamp(life.stats.happiness + 8); log(life, 'good', 'military.medal'); return 'medal' }
  life.stats.happiness = clamp(life.stats.happiness + 3)
  log(life, 'info', 'military.deploymentOver')
  return 'safe'
}

export function countryTaxFactor(code: string) {
  return TAX_FACTOR[code] ?? 1
}
/** Rough national income-tax multipliers vs our base brackets. */
export const TAX_FACTOR: Record<string, number> = {
  DK: 1.25, SE: 1.25, FI: 1.2, NO: 1.15, BE: 1.2, DE: 1.15, FR: 1.15, AT: 1.15, NL: 1.1, IT: 1.1, ES: 1.05, IL: 1.05, GB: 1.0, CA: 1.0, AU: 1.0, JP: 1.0, US: 0.95,
  IE: 0.95, CH: 0.8, SG: 0.5, HK: 0.45, AE: 0.1, QA: 0.1, KW: 0.1, SA: 0.15, BH: 0.1, OM: 0.2, MC: 0.1, BS: 0.1, KY: 0.1, BM: 0.1, RU: 0.6, BG: 0.5, RO: 0.5, HU: 0.6, MX: 0.9, BR: 0.9, IN: 0.9, CN: 0.9, TR: 0.9, ZA: 1.0, NG: 0.8, EG: 0.8,
}
export const NO_GAMBLING = new Set(['SA', 'AE', 'QA', 'KW', 'IR', 'BN', 'AF', 'SO', 'YE', 'LY', 'SD'])
export const NO_ALCOHOL = new Set(['SA', 'IR', 'KW', 'BN', 'AF', 'LY', 'SD', 'YE', 'SO', 'MR'])
export function countryName(code: string) { return COUNTRY_BY_CODE[code]?.name ?? code }
