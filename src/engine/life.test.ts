import { describe, expect, it } from 'vitest'
import { ageUp, chooseOption, createLife } from './life'
import { ALL_EVENTS, EVENT_TEXT } from './content'
import { isEligible } from './events'

describe('createLife', () => {
  it('is deterministic for a seed', () => {
    const a = createLife({ seed: 'abc' })
    const b = createLife({ seed: 'abc' })
    expect(a.firstName).toBe(b.firstName)
    expect(a.stats).toEqual(b.stats)
    expect(a.people.map((p) => p.firstName)).toEqual(b.people.map((p) => p.firstName))
  })
  it('starts at age 0 with parents', () => {
    const l = createLife({ seed: 'x' })
    expect(l.age).toBe(0)
    expect(l.people.some((p) => p.kind === 'mother')).toBe(true)
    expect(l.people.some((p) => p.kind === 'father')).toBe(true)
  })
})

describe('ageUp', () => {
  it('advances age and queues at most one event', () => {
    const l = createLife({ seed: 'y' })
    ageUp(l)
    expect(l.age).toBe(1)
    if (l.pending) {
      expect(ALL_EVENTS.some((e) => e.id === l.pending!.eventId)).toBe(true)
    }
  })
  it('refuses to age while an event is pending', () => {
    const l = createLife({ seed: 'z' })
    l.pending = { eventId: 'fake' }
    ageUp(l)
    expect(l.age).toBe(0)
  })
  it('can simulate a full life without throwing', () => {
    const l = createLife({ seed: 'full' })
    let guard = 0
    while (l.alive && guard++ < 400) {
      ageUp(l)
      if (l.pending) chooseOption(l, (ALL_EVENTS.find((e) => e.id === l.pending!.eventId)!).choices[0].id)
    }
    expect(l.alive).toBe(false)
    expect(l.age).toBeGreaterThan(0)
    expect(l.age).toBeLessThan(130)
  })
})

describe('content integrity', () => {
  it('has unique event ids', () => {
    const ids = ALL_EVENTS.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('has English text for every event, choice and outcome', () => {
    const missing: string[] = []
    for (const ev of ALL_EVENTS) {
      const t = EVENT_TEXT.en?.[ev.id]
      if (!t?.text) { missing.push(ev.id); continue }
      for (const c of ev.choices) {
        if (!t.choices?.[c.id]) missing.push(`${ev.id}.choices.${c.id}`)
        for (const o of c.outcomes ?? []) if (!t.outcomes?.[o.id]) missing.push(`${ev.id}.outcomes.${o.id}`)
      }
    }
    expect(missing).toEqual([])
  })
  it('every age 0-90 has at least one eligible event for a fresh life', () => {
    const l = createLife({ seed: 'cov' })
    const gaps: number[] = []
    for (let age = 0; age <= 90; age++) {
      l.age = age
      if (!ALL_EVENTS.some((e) => isEligible(e, l))) gaps.push(age)
    }
    expect(gaps).toEqual([])
  })
})

describe('countries', () => {
  it('every country has a name pool, cities, flag and Hebrew name', async () => {
    const { COUNTRIES, POOLS } = await import('./people')
    const bad = COUNTRIES.filter((c) => !POOLS[c.namePool] || !c.cities.length || !c.flag || !c.nameHe || c.code.length !== 2)
    expect(bad.map((c) => `${c.code}:${c.namePool}`)).toEqual([])
    expect(new Set(COUNTRIES.map((c) => c.code)).size).toBe(COUNTRIES.length)
  })
  it('every pool has 40 female, 40 male and 40 last names', async () => {
    const { POOLS } = await import('./people')
    const bad = Object.entries(POOLS).filter(([, p]) => p.female.length < 40 || p.male.length < 40 || p.last.length < 40).map(([k]) => k)
    expect(bad).toEqual([])
  })
})
