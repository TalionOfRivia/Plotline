import type { Condition, GameEvent, Life, Person } from './types'
import type { Rng } from './rng'

export function isEligible(ev: GameEvent, life: Life): boolean {
  if ((ev.once ?? true) && life.seenEvents.includes(ev.id)) return false
  const c: Condition = ev.conditions ?? {}
  if (c.minAge !== undefined && life.age < c.minAge) return false
  if (c.maxAge !== undefined && life.age > c.maxAge) return false
  if (c.gender && life.gender !== c.gender) return false
  if (c.minMoney !== undefined && life.money < c.minMoney) return false
  if (c.flags && !c.flags.every((f) => Boolean(life.flags[f]))) return false
  if (c.notFlags && c.notFlags.some((f) => Boolean(life.flags[f]))) return false
  if (c.minStats) for (const [k, v] of Object.entries(c.minStats)) if (life.stats[k as keyof typeof life.stats] < v!) return false
  if (c.maxStats) for (const [k, v] of Object.entries(c.maxStats)) if (life.stats[k as keyof typeof life.stats] > v!) return false
  if (c.requiresPerson && !personFor(ev, life)) return false
  return true
}

export function personFor(ev: GameEvent, life: Life): Person | undefined {
  const kind = ev.conditions?.requiresPerson
  if (!kind) return undefined
  const dead = Boolean(ev.conditions?.requiresPersonDead)
  return life.people.find((p) => p.kind === kind && p.alive === !dead)
}

/** Picks a random living person of the event's kind, or undefined. */
export function pickPerson(ev: GameEvent, life: Life, rng: Rng): Person | undefined {
  const kind = ev.conditions?.requiresPerson
  if (!kind) return undefined
  const dead = Boolean(ev.conditions?.requiresPersonDead)
  const pool = life.people.filter((p) => p.kind === kind && p.alive === !dead)
  return pool.length ? rng.pick(pool) : undefined
}

export function pickEvent(events: GameEvent[], life: Life, rng: Rng): GameEvent | undefined {
  const eligible = events.filter((e) => isEligible(e, life))
  return rng.weighted(eligible, (e) => e.weight ?? 1)
}
