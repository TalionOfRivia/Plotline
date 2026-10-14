// Smaller life systems: loans, investments, licenses, emigration, fertility, will,
// lawsuits, betting, sweepstakes, freelance gigs.
import type { Life } from './types'
import type { Rng } from './rng'
import { clamp, log } from './util'
import { COUNTRY_BY_CODE } from './people'

export type Result = { key: string; money?: number; kind: 'good' | 'bad' | 'info' }

// ---- loans -------------------------------------------------------------------

export const LOAN_RATE = 0.08
export function maxLoan(life: Life) {
  const income = (life.job?.salary ?? 0) + life.pension + (life.business ? life.business.value * 0.05 : 0)
  return Math.max(0, Math.round(income * 2 + 5_000 - life.loan))
}
export function takeLoan(life: Life, amount: number): Result {
  if (life.age < 18 || life.prison) return { key: 'loan.denied', kind: 'bad' }
  const amt = Math.min(Math.round(amount), maxLoan(life))
  if (amt <= 0) return { key: 'loan.denied', kind: 'bad' }
  life.loan += amt
  life.money += amt
  log(life, 'info', 'loan.taken', { money: amt })
  return { key: 'loan.taken', money: amt, kind: 'info' }
}
export function repayLoan(life: Life, amount: number): Result {
  const amt = Math.min(Math.round(amount), life.loan, Math.max(0, life.money))
  if (amt <= 0) return { key: 'loan.nothing', kind: 'bad' }
  life.loan -= amt
  life.money -= amt
  log(life, 'good', 'loan.repaid', { money: amt })
  return { key: 'loan.repaid', money: amt, kind: 'good' }
}

// ---- investments -------------------------------------------------------------

export function invest(life: Life, kind: 'index' | 'crypto', amount: number): Result {
  const amt = Math.min(Math.round(amount), Math.max(0, life.money))
  if (amt <= 0 || life.age < 18) return { key: 'invest.nothing', kind: 'bad' }
  life.money -= amt
  life.investments[kind] += amt
  return { key: `invest.bought.${kind}`, money: amt, kind: 'info' }
}
export function withdraw(life: Life, kind: 'index' | 'crypto', amount: number): Result {
  const amt = Math.min(Math.round(amount), life.investments[kind])
  if (amt <= 0) return { key: 'invest.nothing', kind: 'bad' }
  life.investments[kind] -= amt
  life.money += amt
  return { key: `invest.sold.${kind}`, money: amt, kind: 'info' }
}

// ---- licenses ----------------------------------------------------------------

export const LICENSES = {
  has_license: { minAge: 16, cost: 200, base: 0.6 },
  boat_license: { minAge: 16, cost: 600, base: 0.65 },
  pilot_license: { minAge: 18, cost: 12_000, base: 0.35 },
} as const
export type LicenseKey = keyof typeof LICENSES

export function licenseOdds(life: Life, key: LicenseKey) {
  const d = LICENSES[key]
  return clamp(d.base + (life.stats.smarts - 50) / 200, 0.1, 0.95)
}
export function takeLicense(life: Life, key: LicenseKey, rng: Rng): Result {
  const d = LICENSES[key]
  if (life.flags[key]) return { key: 'license.already', kind: 'info' }
  if (life.age < d.minAge || life.money < d.cost || life.prison) return { key: 'license.cant', kind: 'bad' }
  life.money -= d.cost
  if (rng.chance(licenseOdds(life, key))) { life.flags[key] = true; log(life, 'good', `license.passed.${key}`); return { key: `license.passed.${key}`, kind: 'good' } }
  log(life, 'bad', `license.failed.${key}`)
  return { key: `license.failed.${key}`, kind: 'bad' }
}

// ---- emigration --------------------------------------------------------------

export const EMIGRATE_COST = 5_000
export function emigrate(life: Life, code: string, rng: Rng): Result {
  const c = COUNTRY_BY_CODE[code]
  if (!c || code === life.countryCode || life.age < 18 || life.money < EMIGRATE_COST || life.prison) return { key: 'emigrate.cant', kind: 'bad' }
  life.money -= EMIGRATE_COST
  life.countryCode = code
  life.country = c.name
  life.city = rng.pick(c.cities)
  life.flags.emigrated = true
  if (life.job) { life.job = null }
  life.jobBoard = []
  life.stats.happiness = clamp(life.stats.happiness + 5)
  log(life, 'milestone', 'emigrate.moved', { city: life.city, country: c.name })
  return { key: 'emigrate.moved', kind: 'good' }
}

// ---- fertility & will ---------------------------------------------------------

export const IVF_COST = 15_000
export function fertilityTreatment(life: Life): Result {
  if (life.age < 18 || life.money < IVF_COST) return { key: 'fertility.cant', kind: 'bad' }
  life.money -= IVF_COST
  life.flags.ivf = true
  return { key: 'fertility.done', kind: 'info' }
}
export function toggleWill(life: Life): Result {
  life.will = !life.will
  return { key: life.will ? 'will.on' : 'will.off', kind: 'info' }
}

// ---- lawsuits, betting, sweepstakes ------------------------------------------

export const LAWSUIT_COST = 5_000
export function sue(life: Life, rng: Rng): Result {
  if (life.age < 18 || life.money < LAWSUIT_COST) return { key: 'lawsuit.cant', kind: 'bad' }
  life.money -= LAWSUIT_COST
  life.karma = clamp(life.karma - 3, -100, 100)
  if (rng.chance(0.35 + (life.stats.smarts - 50) / 400)) {
    const won = rng.int(10_000, 200_000)
    life.money += won
    log(life, 'good', 'lawsuit.won', { money: won })
    return { key: 'lawsuit.won', money: won, kind: 'good' }
  }
  log(life, 'bad', 'lawsuit.lost')
  return { key: 'lawsuit.lost', kind: 'bad' }
}

export function placeBet(life: Life, kind: 'horse_races' | 'fight_betting', rng: Rng): Result {
  const bet = Math.min(Math.max(100, Math.round(life.money * 0.1)), 50_000)
  if (life.age < 18 || life.money < bet) return { key: 'activity.cantAfford', kind: 'bad' }
  const odds = kind === 'horse_races' ? 0.3 : 0.45
  const mult = kind === 'horse_races' ? 3 : 1.9
  if (rng.chance(odds)) { const win = Math.round(bet * (mult - 1)); life.money += win; life.stats.happiness = clamp(life.stats.happiness + 4); return { key: `bet.won.${kind}`, money: win, kind: 'good' } }
  life.money -= bet; life.stats.happiness = clamp(life.stats.happiness - 3)
  return { key: `bet.lost.${kind}`, money: bet, kind: 'bad' }
}

export function sweepstakes(life: Life, rng: Rng): Result {
  const r = rng.float()
  if (r < 0.002) { life.money += 25_000; return { key: 'sweep.big', money: 25_000, kind: 'good' } }
  if (r < 0.02) { life.money += 500; return { key: 'sweep.small', money: 500, kind: 'good' } }
  return { key: 'sweep.none', kind: 'info' }
}

// ---- freelance gigs -----------------------------------------------------------

export const GIGS = ['dog_sitting', 'moving_help', 'tutoring', 'web_design', 'wedding_dj', 'courier', 'yard_work', 'photo_shoot', 'translation', 'babysitting_gig', 'street_music', 'car_wash']
export function refreshGigs(life: Life, rng: Rng) {
  if (life.age < 14 || life.prison) { life.gigs = []; return }
  const picks = new Set<string>()
  while (picks.size < 3) picks.add(rng.pick(GIGS))
  life.gigs = [...picks]
}
export function gigPay(id: string, life: Life) {
  const base = { dog_sitting: 300, moving_help: 500, tutoring: 900, web_design: 2_500, wedding_dj: 1_500, courier: 600, yard_work: 400, photo_shoot: 1_200, translation: 1_000, babysitting_gig: 350, street_music: 250, car_wash: 200 }[id] ?? 400
  return Math.round(base * (0.8 + life.stats.smarts / 250))
}
export function doGig(life: Life, id: string, rng: Rng): Result {
  if (!life.gigs.includes(id)) return { key: 'gig.gone', kind: 'bad' }
  life.gigs = life.gigs.filter((g) => g !== id)
  const pay = gigPay(id, life)
  if (rng.chance(0.85)) { life.money += pay; life.flags.ever_worked = true; log(life, 'info', `gig.done.${id}`, { money: pay }); return { key: `gig.done.${id}`, money: pay, kind: 'good' } }
  life.stats.happiness = clamp(life.stats.happiness - 2)
  return { key: 'gig.flop', kind: 'bad' }
}

// ---- yearly tick --------------------------------------------------------------

export function extrasYear(life: Life, rng: Rng) {
  // addiction drains health, happiness and cash until rehab
  if (life.flags.addicted) {
    life.stats.health = clamp(life.stats.health - rng.int(3, 8))
    life.stats.happiness = clamp(life.stats.happiness - rng.int(2, 6))
    life.money -= rng.int(2_000, 12_000)
    if (life.job) life.job.performance = clamp(life.job.performance - rng.int(3, 10))
    if (rng.chance(0.03)) { log(life, 'bad', 'vice.overdoseScare'); life.stats.health = clamp(life.stats.health - 20) }
  }
  // loan interest + minimum repayment
  if (life.loan > 0) {
    life.loan = Math.round(life.loan * (1 + LOAN_RATE))
    const pay = Math.min(life.loan, Math.round(life.loan * 0.15) + 500)
    life.money -= pay
    life.loan -= pay
    if (life.money < -30_000) { life.flags.bankrupt = true }
  }
  // markets
  const inv = life.investments
  if (inv.index > 0) inv.index = Math.round(inv.index * (1 + rng.int(-15, 22) / 100))
  if (inv.crypto > 0) inv.crypto = Math.round(inv.crypto * (1 + rng.int(-60, 150) / 100))
  refreshGigs(life, rng)
}

/** Yearly income/expense snapshot for the finances card. */
export function financeSnapshot(life: Life) {
  const salary = life.job?.salary ?? 0
  return {
    salary,
    pension: life.pension,
    business: life.business ? Math.round(life.business.value * 0.05) : 0,
    upkeep: life.assets.reduce((s, a) => s + (ASSET_UPKEEP[a.assetId] ?? 0), 0),
    loan: life.loan,
    investments: life.investments.index + life.investments.crypto,
  }
}
// filled lazily to avoid a circular import at module init
export const ASSET_UPKEEP: Record<string, number> = {}
