import challengesData from '../content/systems/challenges.json'
import type { Life } from './types'
import { netWorth } from './assets'
import { log } from './util'

export interface Goal { kind: string; value?: number | string; n?: number }
export interface ChallengeDef { id: string; emoji: string; tier: 'easy' | 'medium' | 'hard' | 'legendary' | 'achievement'; goals: Goal[] }
export const CHALLENGES = challengesData as ChallengeDef[]

const stat = (life: Life, k: unknown) => life.stats[k as keyof Life['stats']] ?? 0

/** Is a single goal currently satisfied? */
export function goalMet(life: Life, g: Goal): boolean {
  const v = g.value, n = g.n ?? 0
  const num = typeof v === 'number' ? v : Number(v)
  switch (g.kind) {
    case 'age_min': return life.age >= num
    case 'age_max': return life.age <= num
    case 'money_min': return netWorth(life) >= num
    case 'job_track': return Boolean(life.job && life.job.trackId === v && life.job.rung >= n)
    case 'degree': return life.education.degrees.includes(String(v))
    case 'kids_min': return life.people.filter((p) => p.kind === 'child').length >= num
    case 'marriages_min': return life.marriages >= num
    case 'friends_min': return life.people.filter((p) => p.kind === 'friend' && p.alive).length >= num
    case 'pets_min': return life.people.filter((p) => p.kind === 'pet' && p.alive).length >= num
    case 'houses_min': return life.assets.filter((a) => a.kind === 'house').length >= num
    case 'cars_min': return life.assets.filter((a) => a.kind === 'car').length >= num
    case 'asset': return life.assets.some((a) => a.assetId === v)
    case 'crimes_min': return life.crimes >= num
    case 'convictions_min': return life.convictions >= num
    case 'prison_years_min': return life.prisonYears >= num
    case 'fame_min': return life.fame >= num
    case 'karma_min': return life.karma >= num
    case 'karma_max': return life.karma <= num
    case 'stat_min': return stat(life, v) >= n
    case 'stat_max': return stat(life, v) <= n
    case 'flag': return Boolean(life.flags[String(v)])
    case 'generation_min': return life.generation >= num
    case 'country': return life.countryCode === v
    default: return false
  }
}

/** Progress 0..1 for the UI (fraction of goals met). */
export function challengeProgress(life: Life, c: ChallengeDef) {
  const met = c.goals.filter((g) => goalMet(life, g)).length
  return { met, total: c.goals.length }
}

/** Yearly check; returns ids newly completed this year. */
export function checkChallenges(life: Life, completed: string[]): string[] {
  const fresh: string[] = []
  for (const c of CHALLENGES) {
    if (completed.includes(c.id)) continue
    if (c.goals.every((g) => goalMet(life, g))) {
      fresh.push(c.id)
      log(life, 'good', 'challenge.completed', { id: c.id })
    }
  }
  return fresh
}
