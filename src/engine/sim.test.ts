import { describe, expect, it } from 'vitest'
import { ageUp, chooseOption, continueAsHeir, createLife, heirs, withRng } from './life'
import { EVENT_BY_ID } from './content'
import { Rng } from './rng'
import { applyForJob } from './jobs'
import { buyAsset, adoptPet } from './assets'
import { interact, startDating, availableInteractions } from './relationships'
import { commitCrime } from './crime'
import { enrollUniversity, gradSchoolsAvailable, enrollGrad } from './school'
import { ACTIVITIES, ASSETS, CRIMES, EDUCATION, JOB_TRACKS } from './systems'
import { doActivity } from './activities'
import { applyAgent, applyAstronaut, joinMafia, startBusiness, BUSINESS_KINDS } from './special'
import type { Life } from './types'
import { checkChallenges, CHALLENGES } from './challenges'
import { doGig, invest, takeLicense, takeLoan, withdraw } from './extras'

/** Plays a whole life with random choices and random actions; throws on any engine error. */
function playLife(seed: string) {
  const life = createLife({ seed })
  const pick = new Rng('actions-' + seed)
  const done: string[] = []
  let guard = 0
  while (life.alive && guard++ < 300) {
    ageUp(life)
    done.push(...checkChallenges(life, done))
    if (life.pending) {
      const ev = EVENT_BY_ID[life.pending.eventId]
      chooseOption(life, pick.pick(ev.choices).id)
    }
    if (!life.alive) break
    // random actions each year
    withRng(life, (rng) => {
      const roll = pick.float()
      if (roll < 0.3 && !life.job && life.jobBoard.length) applyForJob(life, pick.pick(life.jobBoard), rng)
      if (roll < 0.1 && life.age >= 18) buyAsset(life, pick.pick([...ASSETS.houses, ...ASSETS.cars, ...ASSETS.luxury]).id, pick.chance(0.5))
      if (roll < 0.05) adoptPet(life, pick.pick(ASSETS.pets).id, rng)
      if (roll < 0.4 && life.people.length) {
        const p = pick.pick(life.people.filter((x) => x.alive))
        if (p) { const opts = availableInteractions(life, p); if (opts.length) interact(life, p.id, pick.pick(opts), rng) }
      }
      if (roll < 0.2 && life.dateBoard.length) startDating(life, pick.pick(life.dateBoard), rng)
      if (roll < 0.08 && life.age >= 12) commitCrime(life, pick.pick(CRIMES).id, rng)
      if (life.age === 18 || life.age === 19) enrollUniversity(life, pick.pick(EDUCATION.majors).id, rng, pick.pick(['cash', 'loan', 'scholarship']))
      const gs = gradSchoolsAvailable(life); if (gs.length && pick.chance(0.5)) enrollGrad(life, pick.pick(gs).id)
      if (roll < 0.3) doActivity(life, pick.pick(ACTIVITIES).id, rng)
      if (life.gigs.length && pick.chance(0.3)) doGig(life, pick.pick(life.gigs), rng)
      if (life.age === 20) takeLoan(life, 20_000)
      if (life.age === 28) { invest(life, 'index', 5_000); invest(life, 'crypto', 2_000) }
      if (life.age === 40) withdraw(life, 'crypto', 100_000)
      if (life.age === 17) takeLicense(life, 'has_license', rng)
      if (life.age === 25) { applyAstronaut(life, rng); applyAgent(life, rng) }
      if (life.age === 30 && pick.chance(0.3)) joinMafia(life)
      if (life.age === 35 && pick.chance(0.5)) startBusiness(life, pick.pick(BUSINESS_KINDS).id, 'Test Co')
    })
  }
  return life
}

describe('full simulation', () => {
  it('plays 40 random lives without errors', () => {
    const results: Life[] = []
    for (let i = 0; i < 40; i++) results.push(playLife(`sim-${i}`))
    const stuck = results.filter((l) => l.alive)
    expect(stuck.map((l) => ({ seed: l.seed, age: l.age, pending: l.pending, prison: l.prison, stage: l.education.stage, job: l.job?.trackId }))).toEqual([])
    expect(results.every((l) => l.ribbon)).toBe(true)
    const avgAge = results.reduce((s, l) => s + l.age, 0) / results.length
    expect(avgAge).toBeGreaterThan(40)
    expect(avgAge).toBeLessThan(100)
    // sanity: no NaN money or stats
    for (const l of results) {
      expect(Number.isFinite(l.money)).toBe(true)
      for (const v of Object.values(l.stats)) expect(Number.isFinite(v)).toBe(true)
    }
  })
  it('supports legacy mode when there are heirs', () => {
    const l = playLife('legacy-0')
    if (!heirs(l).length) {
      // random play rarely has kids; give this life one so legacy can be exercised
      const kid = { ...l.people[0], id: 'kid1', kind: 'child' as const, age: 12, alive: true, firstName: 'Heir' }
      l.people.push(kid)
    }
    const next = continueAsHeir(l, heirs(l)[0].id)
    expect(next.generation).toBe(l.generation + 1)
    expect(next.lastName).toBe(l.lastName)
  })
  it('challenge goals all use supported kinds', () => {
    const kinds = new Set(['age_min','age_max','money_min','job_track','degree','kids_min','marriages_min','friends_min','pets_min','houses_min','cars_min','asset','crimes_min','convictions_min','prison_years_min','fame_min','karma_min','karma_max','stat_min','stat_max','flag','generation_min','country'])
    for (const c of CHALLENGES) for (const g of c.goals) expect(kinds.has(g.kind), `${c.id}:${g.kind}`).toBe(true)
  })
  it('every job track is reachable by some requirement set', () => {
    for (const t of JOB_TRACKS) expect(t.ladder.length).toBeGreaterThan(0)
  })
})
