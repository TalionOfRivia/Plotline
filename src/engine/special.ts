// Fame, royalty, mafia, business, astronaut, secret agent — the "premium" paths, all free here.
import type { Life } from './types'
import type { Rng } from './rng'
import { clamp, kill, log, use, used } from './util'
import { COUNTRY_BY_CODE, makePerson } from './people'

// ---- fame -------------------------------------------------------------------

export function fameYear(life: Life, rng: Rng) {
  const famousJob = life.flags.fame_career
  if (famousJob && life.job) {
    life.fame = clamp(life.fame + rng.int(1, 4) + life.job.rung)
  } else {
    life.fame = clamp(life.fame - rng.int(2, 6))
  }
  if (life.fame >= 60 && (famousJob || life.fame >= 80)) {
    // endorsements scale steeply with fame but stay below a real salary until true celebrity
    const income = Math.round((life.fame / 100) ** 3 * 400_000 * (0.5 + rng.float()))
    life.money += income
    log(life, 'good', 'fame.income', { money: income })
  }
}

export const PLATFORMS = ['photo', 'video', 'stream', 'micro', 'podcast', 'subs'] as const
export type Platform = (typeof PLATFORMS)[number]

/** One post per platform per year. Followers compound; fame follows followers. */
export function socialMediaPost(life: Life, rng: Rng, platform: Platform = 'photo') {
  if (used(life, `post_${platform}`) >= 1) return false
  use(life, `post_${platform}`)
  life.flags.has_social_media = true
  const f = life.social[platform] ?? 0
  const viral = rng.chance(0.03 + life.stats.looks / 1000 + (life.flags.fame_career ? 0.05 : 0) + Math.min(0.1, f / 2_000_000))
  const gain = viral ? Math.round(5_000 + f * rng.int(30, 120) / 100 + rng.int(0, 50_000)) : Math.round(50 + f * rng.int(2, 12) / 100 + rng.int(0, 400))
  life.social[platform] = f + gain
  const total = Object.values(life.social).reduce((s, n) => s + n, 0)
  const fameFloor = clamp(Math.log10(Math.max(1, total)) * 12 - 20)
  life.fame = clamp(Math.max(life.fame + (viral ? rng.int(4, 10) : rng.int(0, 1)), fameFloor))
  if (platform === 'subs' && total > 20_000) { const pay = Math.round(total * 0.05); life.money += pay; log(life, 'good', 'fame.subsIncome', { money: pay }) }
  log(life, viral ? 'good' : 'info', viral ? 'fame.viralOn' : 'fame.postedOn', { platform, followers: gain })
  return viral
}

// ---- royalty ----------------------------------------------------------------

export function maybeBornRoyal(life: Life, rng: Rng) {
  const p = COUNTRY_BY_CODE[life.countryCode]?.monarchy ? 0.015 : 0.0005
  if (rng.chance(p)) {
    life.royalty = { rank: 'heir', popularity: rng.int(50, 85) }
    life.money += 250_000
    log(life, 'milestone', 'royal.born')
  }
}

export function royalYear(life: Life, rng: Rng) {
  const r = life.royalty
  if (r.rank === 'none') return
  r.popularity = clamp(r.popularity + rng.int(-5, 5) + Math.round(life.karma / 20))
  const stipend = r.rank === 'monarch' ? 1_500_000 : r.rank === 'heir' ? 300_000 : 120_000
  life.money += stipend
  if (r.rank === 'heir' && life.age >= 18) {
    const parent = life.people.find((p) => (p.kind === 'mother' || p.kind === 'father') && p.alive)
    if (!parent || rng.chance(0.04)) { r.rank = 'monarch'; log(life, 'milestone', 'royal.crowned') }
  }
  if (r.rank === 'monarch' && r.popularity < 15 && rng.chance(0.3)) {
    r.rank = 'none'; life.flags.exiled = true; log(life, 'bad', 'royal.overthrown')
  }
}

// ---- mafia ------------------------------------------------------------------

export const MAFIA_RANKS = ['associate', 'soldier', 'capo', 'underboss', 'consigliere', 'boss']

export function joinMafia(life: Life) {
  if (life.mafia || life.age < 18) return false
  life.mafia = { rank: 0, respect: 20 }
  life.karma = clamp(life.karma - 10, -100, 100)
  log(life, 'info', 'mafia.joined')
  return true
}

export function mafiaYear(life: Life, rng: Rng) {
  const m = life.mafia
  if (!m) return
  const income = [20_000, 60_000, 150_000, 400_000, 700_000, 2_000_000][m.rank] * (0.6 + rng.float() * 0.8)
  life.money += Math.round(income)
  m.respect = clamp(m.respect + rng.int(-4, 6))
  if (m.rank < 5 && m.respect > 75 && rng.chance(0.3)) { m.rank++; m.respect = 40; log(life, 'good', 'mafia.promoted', { rank: m.rank }) }
  if (m.respect < 10 && rng.chance(0.4)) { kill(life, 'death.whacked'); return }
  if (rng.chance(0.05)) { life.convictions++; log(life, 'bad', 'mafia.arrested'); life.prison = { yearsLeft: rng.int(2, 8), served: 0, crimeId: 'racketeering' } }
}

// ---- business ---------------------------------------------------------------

export const BUSINESS_KINDS = [
  { id: 'food_truck', cost: 40_000 }, { id: 'coffee_shop', cost: 120_000 }, { id: 'app_startup', cost: 150_000 },
  { id: 'gym_chain', cost: 400_000 }, { id: 'fashion_label', cost: 300_000 }, { id: 'real_estate_firm', cost: 800_000 },
  { id: 'record_label', cost: 500_000 }, { id: 'car_dealership', cost: 1_200_000 },
  { id: 'museum', cost: 1_500_000 }, { id: 'race_garage', cost: 2_000_000 }, { id: 'zoo', cost: 3_000_000 }, { id: 'casino', cost: 6_000_000 },
]

export function startBusiness(life: Life, kindId: string, name: string) {
  const k = BUSINESS_KINDS.find((b) => b.id === kindId)
  if (!k || life.business || life.money < k.cost || life.age < 18 || life.prison) return false
  life.money -= k.cost
  life.business = { name: name.trim() || kindId, kind: kindId, value: k.cost, yearsRunning: 0 }
  log(life, 'milestone', 'business.started', { name: life.business.name })
  return true
}

export function sellBusiness(life: Life) {
  if (!life.business) return
  const price = Math.round(life.business.value * 0.9)
  life.money += price
  log(life, 'good', 'business.sold', { name: life.business.name, money: price })
  life.business = null
}

export function businessYear(life: Life, rng: Rng) {
  const b = life.business
  if (!b) return
  b.yearsRunning++
  const skill = (life.stats.smarts - 50) / 100
  const growth = rng.int(-25, 45) / 100 + skill * 0.2
  b.value = Math.max(0, Math.round(b.value * (1 + growth)))
  const profit = Math.round(b.value * (0.05 + Math.max(0, growth) * 0.3))
  life.money += profit
  log(life, profit >= 0 ? 'good' : 'bad', 'business.profit', { name: b.name, money: profit, growth: Math.round(growth * 100) })
  if (b.value < 5_000) { log(life, 'bad', 'business.bankrupt', { name: b.name }); life.business = null; life.flags.bankrupt = true }
}

// ---- astronaut & agent (gated applications) ----------------------------------

export function canApplyAstronaut(life: Life) {
  return life.age >= 25 && life.age <= 45 && life.education.degrees.includes('university') && life.stats.health >= 70 && life.stats.smarts >= 70 && !life.flags.astronaut_program && !life.flags.astronaut
}
export function applyAstronaut(life: Life, rng: Rng) {
  if (!canApplyAstronaut(life)) return false
  if (rng.chance(life.flags.space_camp ? 0.6 : 0.4)) { life.flags.astronaut_program = true; log(life, 'good', 'space.accepted'); return true }
  log(life, 'bad', 'space.rejected'); return false
}
export function canApplyAgent(life: Life) {
  return life.age >= 22 && life.age <= 40 && life.education.degrees.includes('university') && life.stats.smarts >= 65 && life.convictions === 0 && !life.flags.agent
}
export function applyAgent(life: Life, rng: Rng) {
  if (!canApplyAgent(life)) return false
  if (rng.chance(0.35)) { life.flags.agent = true; log(life, 'good', 'agent.recruited'); return true }
  log(life, 'bad', 'agent.rejected'); return false
}
export function specialCareersYear(life: Life, rng: Rng) {
  if (life.flags.astronaut_program && !life.flags.astronaut) {
    if (rng.chance(0.5)) { life.flags.astronaut = true; log(life, 'milestone', 'space.qualified') }
  }
  if (life.flags.astronaut) { life.money += 140_000; life.fame = clamp(life.fame + 2) }
  if (life.flags.agent) { life.money += life.flags.agent_senior ? 180_000 : 95_000 }
}

/** Spawns a heir candidate list etc. Exported for legacy mode. */
export function newbornFor(life: Life, rng: Rng) {
  return makePerson(rng, life.countryCode, 'child', { age: 0, lastName: life.lastName })
}

/** Verified badges, sponsorship offers and award seasons. */
export function fameExtrasYear(life: Life, rng: Rng) {
  for (const [p, n] of Object.entries(life.social)) {
    if (n >= 100_000 && !life.flags[`verified_${p}`]) { life.flags[`verified_${p}`] = true; life.fame = clamp(life.fame + 5); log(life, 'good', 'fame.verified', { platform: p }) }
  }
  const total = Object.values(life.social).reduce((s, n) => s + n, 0)
  if (!life.pending && total >= 50_000 && rng.chance(0.35)) {
    life.flags.sponsor_pay = Math.round(total * 0.25 * (0.5 + rng.float()))
    life.pending = { eventId: 'sys_sponsorship' }
    life.seenEvents.push('sys_sponsorship')
    return
  }
  if (!life.pending && life.fame >= 70 && rng.chance(0.3)) { life.pending = { eventId: 'sys_award' }; life.seenEvents.push('sys_award') }
}
