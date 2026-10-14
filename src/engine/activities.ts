import type { Life } from './types'
import type { Rng } from './rng'
import { ACTIVITIES } from './systems'
import { applyEffects } from './effects'
import { clamp, kill, log, use, used } from './util'
import { placeBet, sweepstakes } from './extras'
import { WELFARE_STATES } from './school'
import { NO_ALCOHOL, NO_GAMBLING } from './military'

export interface ActivityResult { id: string; key: string; money?: number; kind: 'good' | 'bad' | 'info' }

export function doActivity(life: Life, id: string, rng: Rng): ActivityResult | null {
  const a = ACTIVITIES.find((x) => x.id === id)
  if (!a || life.age < a.minAge || life.prison) return null
  if ((a.special === 'casino' || a.special === 'bet' || a.special === 'lottery') && NO_GAMBLING.has(life.countryCode)) return { id, key: 'activity.illegalHere', kind: 'bad' }
  if ((id === 'nightlife' || id === 'party') && NO_ALCOHOL.has(life.countryCode)) return { id, key: 'activity.illegalHere', kind: 'bad' }
  const limit = a.special === 'casino' || a.special === 'bet' || a.special === 'lottery' ? 3 : 1
  if (used(life, `act_${id}`) >= limit) return { id, key: 'activity.limit', kind: 'info' }
  const cost = (id === 'doctor_visit' || id === 'psychiatrist' || id === 'emergency_room') && WELFARE_STATES.has(life.countryCode) ? 0 : a.cost
  if (life.money < cost) return { id, key: 'activity.cantAfford', kind: 'bad' }
  use(life, `act_${id}`)
  life.money -= cost
  if (a.special === 'bet') { const r = placeBet(life, id as 'horse_races' | 'fight_betting', rng); return { id, ...r } }
  if (a.special === 'sweepstakes') { const r = sweepstakes(life, rng); return { id, ...r } }

  if (a.special === 'lottery') {
    const r = rng.float()
    if (r < 0.000_005) { const w = 2_000_000; life.money += w; life.flags.lottery_winner = true; log(life, 'good', 'activity.lotteryJackpot', { money: w }); return { id, key: 'activity.lotteryJackpot', money: w, kind: 'good' } }
    if (r < 0.002) { const w = rng.int(1_000, 50_000); life.money += w; log(life, 'good', 'activity.lotteryWin', { money: w }); return { id, key: 'activity.lotteryWin', money: w, kind: 'good' } }
    if (r < 0.08) { const w = rng.int(5, 100); life.money += w; return { id, key: 'activity.lotterySmall', money: w, kind: 'info' } }
    return { id, key: 'activity.lotteryLose', kind: 'info' }
  }
  if (a.special === 'casino') {
    const bet = Math.min(Math.max(100, Math.round(life.money * 0.1)), 50_000)
    if (life.money < bet) return { id, key: 'activity.cantAfford', kind: 'bad' }
    if (rng.chance(0.45)) { life.money += bet; life.flags.casino_won = (Number(life.flags.casino_won) || 0) + bet; life.stats.happiness = clamp(life.stats.happiness + 4); return { id, key: 'activity.casinoWin', money: bet, kind: 'good' } }
    life.money -= bet; life.stats.happiness = clamp(life.stats.happiness - 3)
    return { id, key: 'activity.casinoLose', money: bet, kind: 'bad' }
  }
  if (a.risky && rng.chance(0.12)) {
    if (id === 'skydiving' && rng.chance(0.25)) { kill(life, 'death.skydiving'); return { id, key: 'activity.died', kind: 'bad' } }
    if (id === 'race_track' && rng.chance(0.1)) { kill(life, 'death.car_crash'); return { id, key: 'activity.died', kind: 'bad' } }
    life.stats.health = clamp(life.stats.health - 15)
    if (id === 'plastic_surgery') { life.stats.looks = clamp(life.stats.looks - 20); life.flags.plastic_surgery = true }
    log(life, 'bad', `activity.botched.${id}`)
    return { id, key: `activity.botched.${id}`, kind: 'bad' }
  }
  if (id === 'plastic_surgery') life.flags.plastic_surgery = true
  if (id === 'movie') life.flags.count_movie = (Number(life.flags.count_movie) || 0) + 1
  if (['hiking', 'camping', 'fishing', 'garden', 'walk'].includes(id)) life.flags.count_outdoor = (Number(life.flags.count_outdoor) || 0) + 1
  if ((id === 'nightlife' || id === 'party') && !life.flags.addicted && rng.chance(0.06)) { life.flags.addicted = true; log(life, 'bad', 'vice.hooked') }
  if (id === 'rehab') { if (life.flags.addicted && rng.chance(0.7)) { delete life.flags.addicted; log(life, 'good', 'vice.clean') } else if (life.flags.addicted) log(life, 'bad', 'vice.relapse') }
  if (id === 'doctor_visit' || id === 'emergency_room') {
    if (life.stats.health < 40) life.flags.survived_illness = true
    const ail = life.flags.ailment
    if (ail) {
      if (rng.chance(id === 'emergency_room' ? 0.95 : 0.8)) { delete life.flags.ailment; life.stats.health = clamp(life.stats.health + 8); life.stats.happiness = clamp(life.stats.happiness + 10); log(life, 'good', 'health.cured', { ailment: String(ail) }); return { id, key: 'health.cured', kind: 'good' } }
      log(life, 'bad', 'health.treatmentFailed', { ailment: String(ail) }); return { id, key: 'health.treatmentFailed', kind: 'bad' }
    }
  }
  if (id === 'psychiatrist') {
    if (life.flags.depressed) {
      if (rng.chance(0.6)) { delete life.flags.depressed; life.stats.happiness = clamp(life.stats.happiness + 60); log(life, 'good', 'health.depressionCured'); return { id, key: 'health.depressionCured', kind: 'good' } }
      return { id, key: 'health.depressionOngoing', kind: 'info' }
    }
  }
  applyEffects(life, a.effects, undefined, rng)
  log(life, 'info', `activity.did.${id}`)
  return { id, key: `activity.did.${id}`, kind: 'info' }
}
