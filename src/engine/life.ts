import { Rng, newSeed } from './rng'
import { applyEffects } from './effects'
import { ALL_EVENTS, EVENT_BY_ID } from './content'
import { pickEvent, pickPerson } from './events'
import { NAMES, makePerson, randomName } from './people'
import { clamp, kill, log } from './util'
import { syncDerivedFlags } from './derived'
import { schoolYear } from './school'
import { refreshJobBoard, workYear } from './jobs'
import { assetsYear } from './assets'
import { refreshDateBoard, relationshipsYear } from './relationships'
import { prisonYear } from './crime'
import { businessYear, fameYear, mafiaYear, maybeBornRoyal, royalYear, specialCareersYear } from './special'
import { awardRibbon } from './ribbons'
import type { Gender, Life, Person } from './types'

export interface NewLifeOptions {
  seed?: string
  gender?: Gender
  countryCode?: string
  firstName?: string
  lastName?: string
  /** legacy mode: inherit from a parent life */
  inherit?: { money: number; lastName: string; countryCode: string; city: string; generation: number; royal: boolean; parent: Person; otherParent?: Person }
}

export function blankLife(seed: string): Life {
  return {
    id: seed, seed, firstName: '', lastName: '', gender: 'female', country: '', countryCode: 'US', city: '',
    age: 0, birthYear: new Date().getFullYear(), alive: true,
    stats: { happiness: 50, health: 50, smarts: 50, looks: 50 }, karma: 0, money: 0,
    people: [], diary: [], seenEvents: [], flags: {}, pending: null, rngCalls: 0,
    education: { stage: 'none', grades: 0, yearsIn: 0, degrees: [], loans: 0 },
    job: null, retired: false, pension: 0, assets: [], fame: 0, crimes: 0, convictions: 0,
    prison: null, prisonYears: 0, royalty: { rank: 'none', popularity: 50 }, mafia: null, business: null,
    marriages: 0, jobBoard: [], dateBoard: [], generation: 1,
  }
}

export function createLife(opts: NewLifeOptions = {}): Life {
  const seed = opts.seed ?? newSeed()
  const rng = new Rng(seed)
  const inh = opts.inherit
  const country = NAMES.countries.find((c) => c.code === (opts.countryCode ?? inh?.countryCode)) ?? rng.pick(NAMES.countries)
  const gender: Gender = opts.gender ?? (rng.chance(0.5) ? 'female' : 'male')
  const name = randomName(rng, country.code, gender)
  const lastName = opts.lastName ?? inh?.lastName ?? name.last

  const life = blankLife(seed)
  Object.assign(life, {
    firstName: opts.firstName ?? name.first,
    lastName,
    gender,
    country: country.name,
    countryCode: country.code,
    city: inh?.city ?? rng.pick(country.cities),
    stats: { happiness: rng.bell(40, 100), health: rng.bell(50, 100), smarts: rng.bell(20, 100), looks: rng.bell(20, 100) },
    generation: inh?.generation ?? 1,
  })

  if (inh) {
    // legacy: the previous character becomes the parent
    const parent: Person = { ...inh.parent, kind: inh.parent.gender === 'female' ? 'mother' : 'father', relationship: rng.int(70, 95) }
    life.people.push(parent)
    if (inh.otherParent) life.people.push({ ...inh.otherParent, kind: inh.otherParent.gender === 'female' ? 'mother' : 'father', relationship: rng.int(60, 90) })
    else life.people.push(makePerson(rng, country.code, parent.kind === 'mother' ? 'father' : 'mother', { gender: parent.kind === 'mother' ? 'male' : 'female', lastName, age: parent.age + rng.int(-5, 5) }))
    life.money = inh.money
    if (inh.royal) life.royalty = { rank: 'heir', popularity: rng.int(50, 85) }
    log(life, 'milestone', 'diary.bornLegacy', { city: life.city, country: life.country, generation: life.generation })
  } else {
    const mother = makePerson(rng, country.code, 'mother', { gender: 'female', lastName, age: rng.int(19, 42) })
    const father = makePerson(rng, country.code, 'father', { gender: 'male', lastName, age: rng.int(20, 48) })
    life.people.push(mother, father)
    const sibs = rng.weighted([0, 1, 2], (n) => [45, 40, 15][n])!
    for (let i = 0; i < sibs; i++) life.people.push(makePerson(rng, country.code, 'sibling', { lastName, age: rng.int(1, 8) }))
    log(life, 'milestone', 'diary.born', { city: life.city, country: life.country })
    log(life, 'info', 'diary.parents', { mother: mother.firstName, father: father.firstName })
    maybeBornRoyal(life, rng)
  }
  syncDerivedFlags(life)
  life.rngCalls = rng.calls
  return life
}

export function rngFor(life: Life) {
  return new Rng(life.seed, life.rngCalls)
}

/** Run a player action with the life's RNG and keep the sequence persistent. */
export function withRng<T>(life: Life, fn: (rng: Rng) => T): T {
  const rng = rngFor(life)
  const out = fn(rng)
  life.rngCalls = rng.calls
  syncDerivedFlags(life)
  return out
}

/**
 * Advance one year. Mutates `life` (use inside Immer). Queues at most one event in
 * `life.pending`; the UI resolves it with `chooseOption`.
 */
export function ageUp(life: Life) {
  if (!life.alive || life.pending) return
  const rng = rngFor(life)
  life.age += 1
  for (const p of life.people) if (p.alive) p.age += 1
  log(life, 'milestone', 'diary.birthday', { age: life.age })

  // natural drift
  const s = life.stats
  if (life.age > 45) s.health = clamp(s.health - rng.int(0, 2) - Math.floor((life.age - 45) / 12))
  if (life.age > 30) s.looks = clamp(s.looks - rng.int(0, 1) - Math.floor((life.age - 30) / 15))
  if (life.age < 18) s.smarts = clamp(s.smarts + rng.int(0, 1))
  s.happiness = clamp(s.happiness + rng.int(-3, 3))
  for (const p of life.people) if (p.alive && p.kind !== 'pet') p.relationship = clamp(p.relationship - rng.int(0, 2))

  // family mortality
  for (const p of life.people) {
    if (!p.alive || p.kind === 'pet') continue
    const risk = p.age < 60 ? 0.002 : p.age < 75 ? 0.02 : p.age < 90 ? 0.08 : 0.25
    if (rng.chance(risk)) {
      p.alive = false
      log(life, 'bad', 'diary.personDied', { name: p.firstName, kind: p.kind, age: p.age })
      s.happiness = clamp(s.happiness - (p.relationship > 60 ? 15 : 5))
      // inheritance from parents
      if ((p.kind === 'mother' || p.kind === 'father') && life.age >= 18 && rng.chance(0.6)) {
        const inh = rng.int(5_000, 150_000) * (life.royalty.rank !== 'none' ? 50 : 1)
        life.money += inh
        log(life, 'info', 'diary.inherited', { name: p.firstName, money: inh })
      }
    }
  }

  // systems
  prisonYear(life, rng)
  schoolYear(life, rng)
  workYear(life, rng)
  assetsYear(life, rng)
  relationshipsYear(life, rng)
  fameYear(life, rng)
  royalYear(life, rng)
  mafiaYear(life, rng)
  businessYear(life, rng)
  specialCareersYear(life, rng)
  if (life.flags.astronaut) { if (rng.chance(0.5)) life.flags.in_space = true; else delete life.flags.in_space }
  if (!life.job && !life.retired && life.age >= 18 && life.age < 70 && life.money < 0) {
    life.money -= 8_000 // cost of living with no income
  }
  refreshJobBoard(life, rng)
  refreshDateBoard(life, rng)
  syncDerivedFlags(life)

  if (!life.alive) { finish(life); life.rngCalls = rng.calls; return }

  // own mortality
  const base = life.age < 50 ? 0.001 : life.age < 70 ? 0.01 : life.age < 85 ? 0.05 : 0.15
  const healthMod = (100 - s.health) / 100
  if (rng.chance(base * (0.5 + healthMod * 1.5)) || (s.health <= 0 && rng.chance(0.6))) {
    kill(life, s.health < 30 ? 'death.illness' : life.age > 80 ? 'death.oldAge' : 'death.sudden')
    finish(life)
    life.rngCalls = rng.calls
    return
  }

  // event roll
  const roll = life.age < 18 ? 1 : rng.chance(0.8) ? 1 : 0
  if (roll) {
    const ev = pickEvent(ALL_EVENTS, life, rng)
    if (ev) {
      const person = pickPerson(ev, life, rng)
      life.pending = { eventId: ev.id, personId: person?.id }
      life.seenEvents.push(ev.id)
    }
  }
  life.rngCalls = rng.calls
}

export function finish(life: Life) {
  if (!life.ribbon) life.ribbon = awardRibbon(life)
}

/** Resolve the pending event with the chosen option. Returns the outcome id, if a random one was rolled. */
export function chooseOption(life: Life, choiceId: string): string | undefined {
  const pend = life.pending
  if (!pend) return
  const ev = EVENT_BY_ID[pend.eventId]
  const choice = ev?.choices.find((c) => c.id === choiceId)
  if (!choice) { life.pending = null; return }
  const rng = rngFor(life)
  const person = life.people.find((p) => p.id === pend.personId)
  let outcomeId: string | undefined
  if (choice.outcomes?.length) {
    const out = rng.weighted(choice.outcomes, (o) => o.weight)!
    outcomeId = out.id
    applyEffects(life, out.effects, person, rng)
  } else {
    applyEffects(life, choice.effects, person, rng)
  }
  life.diary.push({
    age: life.age,
    kind: 'event',
    text: `event:${ev.id}:${choiceId}${outcomeId ? ':' + outcomeId : ''}`,
    params: { name: person?.firstName ?? '' },
  })
  life.pending = null
  if (!life.alive) finish(life)
  syncDerivedFlags(life)
  life.rngCalls = rng.calls
  return outcomeId
}

/** Odds (0..1) for each outcome of a choice, for the transparent-odds display. */
export function choiceOdds(eventId: string, choiceId: string): Record<string, number> {
  const choice = EVENT_BY_ID[eventId]?.choices.find((c) => c.id === choiceId)
  if (!choice?.outcomes) return {}
  const total = choice.outcomes.reduce((s, o) => s + o.weight, 0)
  return Object.fromEntries(choice.outcomes.map((o) => [o.id, o.weight / total]))
}

/** Legacy: continue as one of the dead character's children. */
export function heirs(life: Life): Person[] {
  return life.people.filter((p) => p.kind === 'child' && p.alive)
}

export function continueAsHeir(life: Life, heirId: string): Life {
  const heir = life.people.find((p) => p.id === heirId)
  if (!heir) return createLife()
  const inheritance = Math.round((life.money + life.assets.reduce((s, a) => s + a.value - a.mortgage, 0)) * 0.6)
  const parentPerson: Person = { ...life as unknown as Person, id: life.id, firstName: life.firstName, lastName: life.lastName, gender: life.gender, age: life.age, kind: 'mother', relationship: 80, alive: false }
  const spouse = life.people.find((p) => p.kind === 'spouse' && p.alive)
  const next = createLife({
    seed: newSeed(),
    gender: heir.gender,
    firstName: heir.firstName,
    inherit: { money: inheritance, lastName: life.lastName, countryCode: life.countryCode, city: life.city, generation: life.generation + 1, royal: life.royalty.rank !== 'none', parent: parentPerson, otherParent: spouse },
  })
  // the heir is already `heir.age` years old: fast-forward quietly
  const target = Math.max(0, heir.age)
  let guard = 0
  while (next.age < target && next.alive && guard++ < 120) {
    ageUp(next)
    if (next.pending) {
      const ev = EVENT_BY_ID[next.pending.eventId]
      chooseOption(next, ev.choices[0].id)
    }
  }
  // the dead parent is gone for the heir too
  const p = next.people.find((x) => x.id === life.id)
  if (p) p.alive = false
  return next
}
