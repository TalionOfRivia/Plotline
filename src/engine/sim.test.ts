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

/** Plays a whole life with random choices and random actions; throws on any engine error. */
function playLife(seed: string) {
  const life = createLife({ seed })
  const pick = new Rng('actions-' + seed)
  let guard = 0
  while (life.alive && guard++ < 300) {
    ageUp(life)
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
    expect(results.every((l) => !l.alive)).toBe(true)
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
    for (let i = 0; i < 20; i++) {
      const l = playLife(`legacy-${i}`)
      const hs = heirs(l)
      if (hs.length) {
        const next = continueAsHeir(l, hs[0].id)
        expect(next.generation).toBe(l.generation + 1)
        expect(next.lastName).toBe(l.lastName)
        return
      }
    }
    throw new Error('no life produced heirs in 20 tries')
  })
  it('every job track is reachable by some requirement set', () => {
    for (const t of JOB_TRACKS) expect(t.ladder.length).toBeGreaterThan(0)
  })
})
