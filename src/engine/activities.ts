import type { Life } from './types'
import type { Rng } from './rng'
import { ACTIVITIES } from './systems'
import { applyEffects } from './effects'
import { clamp, kill, log } from './util'

export interface ActivityResult { id: string; key: string; money?: number; kind: 'good' | 'bad' | 'info' }

export function doActivity(life: Life, id: string, rng: Rng): ActivityResult | null {
  const a = ACTIVITIES.find((x) => x.id === id)
  if (!a || life.age < a.minAge || life.prison) return null
  if (life.money < a.cost) return { id, key: 'activity.cantAfford', kind: 'bad' }
  life.money -= a.cost

  if (a.special === 'lottery') {
    const r = rng.float()
    if (r < 0.000_02) { const w = 10_000_000; life.money += w; life.flags.lottery_winner = true; log(life, 'good', 'activity.lotteryJackpot', { money: w }); return { id, key: 'activity.lotteryJackpot', money: w, kind: 'good' } }
    if (r < 0.002) { const w = rng.int(1_000, 50_000); life.money += w; log(life, 'good', 'activity.lotteryWin', { money: w }); return { id, key: 'activity.lotteryWin', money: w, kind: 'good' } }
    if (r < 0.08) { const w = rng.int(5, 100); life.money += w; return { id, key: 'activity.lotterySmall', money: w, kind: 'info' } }
    return { id, key: 'activity.lotteryLose', kind: 'info' }
  }
  if (a.special === 'casino') {
    const bet = Math.min(Math.max(100, Math.round(life.money * 0.1)), 50_000)
    if (life.money < bet) return { id, key: 'activity.cantAfford', kind: 'bad' }
    if (rng.chance(0.45)) { life.money += bet; life.stats.happiness = clamp(life.stats.happiness + 4); return { id, key: 'activity.casinoWin', money: bet, kind: 'good' } }
    life.money -= bet; life.stats.happiness = clamp(life.stats.happiness - 3)
    return { id, key: 'activity.casinoLose', money: bet, kind: 'bad' }
  }
  if (a.risky && rng.chance(0.12)) {
    if (id === 'skydiving' && rng.chance(0.25)) { kill(life, 'death.skydiving'); return { id, key: 'activity.died', kind: 'bad' } }
    life.stats.health = clamp(life.stats.health - 15)
    if (id === 'plastic_surgery') { life.stats.looks = clamp(life.stats.looks - 20); life.flags.plastic_surgery = true }
    log(life, 'bad', `activity.botched.${id}`)
    return { id, key: `activity.botched.${id}`, kind: 'bad' }
  }
  if (id === 'plastic_surgery') life.flags.plastic_surgery = true
  if (id === 'doctor_visit' && life.stats.health < 40) { life.flags.survived_illness = true }
  applyEffects(life, a.effects, undefined, rng)
  log(life, 'info', `activity.did.${id}`)
  return { id, key: `activity.did.${id}`, kind: 'info' }
}
