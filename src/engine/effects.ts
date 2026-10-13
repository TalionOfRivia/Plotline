import type { Effects, Life, Person, Stats } from './types'

export const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v))

const STAT_KEYS: (keyof Stats)[] = ['happiness', 'health', 'smarts', 'looks']

/** Mutates `life` in place (call inside an Immer producer or on a fresh copy). */
export function applyEffects(life: Life, fx: Effects | undefined, person?: Person) {
  if (!fx) return
  for (const k of STAT_KEYS) {
    const d = fx[k]
    if (d) life.stats[k] = clamp(life.stats[k] + d)
  }
  if (fx.karma) life.karma = clamp(life.karma + fx.karma, -100, 100)
  if (fx.money) life.money = Math.round(life.money + fx.money)
  if (fx.flags) {
    for (const [k, v] of Object.entries(fx.flags)) {
      if (v === false) delete life.flags[k]
      else life.flags[k] = v
    }
  }
  if (fx.relationship && person) {
    person.relationship = clamp(person.relationship + fx.relationship)
  }
  if (fx.death) {
    life.alive = false
    life.causeOfDeath = fx.death
  }
}
