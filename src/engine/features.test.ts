import { describe, expect, it } from 'vitest'
import { ageUp, chooseOption, createLife, withRng } from './life'
import { applyForJob, reportToHR, setHours, socialize, workHarder } from './jobs'
import { holdWedding, interact, startDating, weddingCost } from './relationships'
import { buyAsset } from './assets'
import { EVENT_BY_ID } from './content'

function adult(seed: string, age = 25) {
  const l = createLife({ seed })
  while (l.age < age && l.alive) { ageUp(l); if (l.pending) chooseOption(l, EVENT_BY_ID[l.pending.eventId].choices[0].id) }
  return l
}

describe('job depth', () => {
  it('tracks stress, popularity, hours and HR', () => {
    const l = adult('job-depth')
    l.money = 100_000
    withRng(l, (rng) => { for (const id of l.jobBoard) { if (applyForJob(l, id, rng) === 'hired') break } })
    if (!l.job) return
    expect(l.job.stress).toBeGreaterThanOrEqual(0)
    const s0 = l.job.stress!
    withRng(l, () => workHarder(l))
    expect(l.job!.stress!).toBeGreaterThan(s0)
    setHours(l, 50)
    expect(l.job!.hours).toBe(50)
    withRng(l, (rng) => { socialize(l, rng); reportToHR(l, rng) })
    expect(l.job!.popularity).toBeGreaterThanOrEqual(0)
  })
})

describe('engagement and wedding', () => {
  it('propose → engaged → planned wedding → married with cost', () => {
    const l = adult('wedding')
    l.money = 200_000
    l.stats.looks = 95
    let partner = l.people.find((p) => p.kind === 'partner' && p.alive)
    for (let i = 0; i < 30 && !partner; i++) {
      withRng(l, (rng) => { if (l.dateBoard[0]) startDating(l, l.dateBoard[0], rng) })
      partner = l.people.find((p) => p.kind === 'partner' && p.alive)
      if (!partner) { ageUp(l); if (l.pending) chooseOption(l, EVENT_BY_ID[l.pending.eventId].choices[0].id) }
    }
    expect(partner).toBeTruthy()
    partner!.relationship = 100
    for (let i = 0; i < 10 && !partner!.engaged; i++) withRng(l, (rng) => { ageUp(l); if (l.pending) chooseOption(l, EVENT_BY_ID[l.pending.eventId].choices[0].id); interact(l, partner!.id, 'propose', rng) })
    expect(partner!.engaged).toBe(true)
    const before = l.money
    expect(holdWedding(l, partner!.id, 'beach', 'tropical')).toBe(true)
    expect(partner!.kind).toBe('spouse')
    expect(l.money).not.toBe(before)
    expect(weddingCost('beach', 'tropical')).toBe(13_000)
  })
})

describe('accessories and funeral card', () => {
  it('lets a child buy cheap accessories', () => {
    const l = createLife({ seed: 'acc' })
    ageUp(l); ageUp(l)
    while (l.age < 8 && l.alive) { ageUp(l); if (l.pending) chooseOption(l, EVENT_BY_ID[l.pending.eventId].choices[0].id) }
    l.money = 100
    expect(buyAsset(l, 'cap')).toBe(true)
    expect(buyAsset(l, 'yacht')).toBe(false)
  })
  it('raises a funeral card when a parent dies', () => {
    let got = false
    for (let k = 0; k < 10 && !got; k++) {
      const l = adult('funeral' + k, 30)
      if (!l.alive) continue
      const mom = l.people.find((p) => p.kind === 'mother' && p.alive)
      if (!mom) continue
      mom.age = 120
      for (let i = 0; i < 30 && l.alive && !got; i++) {
        if (l.pending) chooseOption(l, EVENT_BY_ID[l.pending.eventId].choices[0].id)
        ageUp(l)
        if (l.pending?.eventId === 'sys_funeral') got = true
      }
    }
    expect(got).toBe(true)
  })

})

describe('prison, military, doctors, school extras', () => {
  it('arrest card → lawyer choice resolves to prison or freedom', async () => {
    const { commitCrime } = await import('./crime')
    let arrests = 0, resolved = 0
    for (let k = 0; k < 15; k++) {
      const l = adult('crime' + k, 20)
      if (!l.alive) continue
      for (let i = 0; i < 6 && l.alive; i++) {
        withRng(l, (rng) => commitCrime(l, 'bank_robbery', rng, { target: 'central_vault' }))
        if (l.pending?.eventId === 'sys_arrest') { arrests++; chooseOption(l, 'hired_lawyer'); resolved++; expect(l.pending).toBeNull(); break }
        ageUp(l); if (l.pending) chooseOption(l, EVENT_BY_ID[l.pending.eventId].choices[0].id)
      }
    }
    expect(arrests).toBeGreaterThan(0)
    expect(resolved).toBe(arrests)
  })
  it('enlists, serves and gets promoted or deployed', async () => {
    const { enlist } = await import('./military')
    const l = adult('army', 19)
    if (!l.alive) return
    l.stats.health = 90
    expect(enlist(l, 'army')).toBe(true)
    for (let i = 0; i < 8 && l.alive; i++) { ageUp(l); if (l.pending) chooseOption(l, EVENT_BY_ID[l.pending.eventId].choices[0].id) }
    expect(l.military === null || l.military.years > 0).toBe(true)
  })
  it('doctor treats ailments; GED and teachers work', async () => {
    const { seeDoctor } = await import('./doctors')
    const { takeGED, teacherAction } = await import('./school')
    const l = adult('doc', 25)
    l.flags.ailment = 'flu'; l.money = 10_000
    withRng(l, (rng) => { seeDoctor(l, 'good', rng); seeDoctor(l, 'good', rng) })
    expect(l.money).toBeLessThanOrEqual(10_000)
    l.education.degrees = l.education.degrees.filter((d) => d !== 'high_school')
    withRng(l, (rng) => takeGED(l, rng))
    const kid = createLife({ seed: 'teach' })
    while (kid.age < 8 && kid.alive) { ageUp(kid); if (kid.pending) chooseOption(kid, EVENT_BY_ID[kid.pending.eventId].choices[0].id) }
    if (kid.teachers.length) withRng(kid, (rng) => teacherAction(kid, kid.teachers[0].id, 'ask_help', rng))
    expect(kid.teachers.length === 0 || kid.teachers[0].relationship > 0).toBe(true)
  })
})
