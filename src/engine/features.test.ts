import { describe, expect, it } from 'vitest'
import { ageUp, chooseOption, createLife, withRng } from './life'
import { applyForJob, reportToHR, setHours, socialize, workHarder } from './jobs'
import { holdWedding, interact, startDating, weddingCost } from './relationships'
import { buyAsset } from './assets'
import { EVENT_BY_ID } from './content'

function adult(seed: string, age = 25) {
  const l = createLife({ seed })
  while (l.age < age) { ageUp(l); if (l.pending) chooseOption(l, EVENT_BY_ID[l.pending.eventId].choices[0].id) }
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
    while (l.age < 8) { ageUp(l); if (l.pending) chooseOption(l, EVENT_BY_ID[l.pending.eventId].choices[0].id) }
    l.money = 100
    expect(buyAsset(l, 'cap')).toBe(true)
    expect(buyAsset(l, 'yacht')).toBe(false)
  })
  it('raises a funeral card when a parent dies', () => {
    const l = adult('funeral', 30)
    const mom = l.people.find((p) => p.kind === 'mother')!
    mom.age = 120
    let got = false
    for (let i = 0; i < 40 && l.alive && !got; i++) {
      ageUp(l)
      if (l.pending?.eventId === 'sys_funeral') { got = true; chooseOption(l, 'plan') }
      else if (l.pending) chooseOption(l, EVENT_BY_ID[l.pending.eventId].choices[0].id)
    }
    expect(got).toBe(true)
  })
})
