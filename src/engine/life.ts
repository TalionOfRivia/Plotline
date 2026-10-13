import namesData from '../content/names.json'
import { Rng, newSeed } from './rng'
import { applyEffects, clamp } from './effects'
import { ALL_EVENTS, EVENT_BY_ID } from './content'
import { pickEvent, pickPerson } from './events'
import type { Gender, Life, Person, RelationKind } from './types'

// ---- names -------------------------------------------------------------------

type NameEntry = string | { latin: string; native: string }
interface Pool { female: NameEntry[]; male: NameEntry[]; last: NameEntry[] }
interface Country { code: string; name: string; cities: string[]; currency: string; namePool: string }
const NAMES = namesData as unknown as { countries: Country[]; pools: Record<string, Pool> }

const latin = (n: NameEntry) => (typeof n === 'string' ? n : n.latin)

function randomName(rng: Rng, pool: Pool, gender: Gender) {
  return { first: latin(rng.pick(pool[gender])), last: latin(rng.pick(pool.last)) }
}

// ---- people ------------------------------------------------------------------

let personCounter = 0
export function makePerson(rng: Rng, pool: Pool, kind: RelationKind, opts: Partial<Person> = {}): Person {
  const gender: Gender = opts.gender ?? (rng.chance(0.5) ? 'female' : 'male')
  const n = randomName(rng, pool, gender)
  return {
    id: `p${Date.now().toString(36)}${(personCounter++).toString(36)}`,
    firstName: opts.firstName ?? n.first,
    lastName: opts.lastName ?? n.last,
    gender,
    age: opts.age ?? 30,
    kind,
    relationship: opts.relationship ?? rng.bell(50, 95),
    alive: true,
    ...opts,
  }
}

// ---- birth -------------------------------------------------------------------

export interface NewLifeOptions {
  seed?: string
  gender?: Gender
  countryCode?: string
  firstName?: string
  lastName?: string
}

export function createLife(opts: NewLifeOptions = {}): Life {
  const seed = opts.seed ?? newSeed()
  const rng = new Rng(seed)
  const country = NAMES.countries.find((c) => c.code === opts.countryCode) ?? rng.pick(NAMES.countries)
  const pool = NAMES.pools[country.namePool] ?? NAMES.pools.en
  const gender: Gender = opts.gender ?? (rng.chance(0.5) ? 'female' : 'male')
  const name = randomName(rng, pool, gender)
  const lastName = opts.lastName ?? name.last

  const mother = makePerson(rng, pool, 'mother', { gender: 'female', lastName, age: rng.int(19, 42) })
  const father = makePerson(rng, pool, 'father', { gender: 'male', lastName, age: rng.int(20, 48) })
  const people: Person[] = [mother, father]
  // 0–2 older siblings
  const sibs = rng.weighted([0, 1, 2], (n) => [45, 40, 15][n])!
  for (let i = 0; i < sibs; i++) people.push(makePerson(rng, pool, 'sibling', { lastName, age: rng.int(1, 8) }))

  const life: Life = {
    id: seed,
    seed,
    firstName: opts.firstName ?? name.first,
    lastName,
    gender,
    country: country.name,
    city: rng.pick(country.cities),
    age: 0,
    birthYear: new Date().getFullYear(),
    alive: true,
    stats: {
      happiness: rng.bell(40, 100),
      health: rng.bell(50, 100),
      smarts: rng.bell(20, 100),
      looks: rng.bell(20, 100),
    },
    karma: 0,
    money: 0,
    people,
    diary: [],
    seenEvents: [],
    flags: {},
    pending: null,
    rngCalls: 0,
  }
  life.diary.push({ age: 0, kind: 'milestone', text: 'diary.born', params: { city: life.city, country: life.country } })
  life.diary.push({ age: 0, kind: 'info', text: 'diary.parents', params: { mother: mother.firstName, father: father.firstName } })
  life.rngCalls = rng.calls
  return life
}

// ---- yearly simulation -------------------------------------------------------

export function rngFor(life: Life) {
  return new Rng(life.seed, life.rngCalls)
}

/**
 * Advance one year. Mutates `life` (use inside Immer). Returns after queueing at
 * most one event in `life.pending`; the UI resolves it with `chooseOption`.
 */
export function ageUp(life: Life) {
  if (!life.alive || life.pending) return
  const rng = rngFor(life)
  life.age += 1
  for (const p of life.people) if (p.alive) p.age += 1

  // natural drift
  const s = life.stats
  if (life.age > 45) s.health = clamp(s.health - rng.int(0, 2) - Math.floor((life.age - 45) / 12))
  if (life.age > 30) s.looks = clamp(s.looks - rng.int(0, 1) - Math.floor((life.age - 30) / 15))
  if (life.age < 18) s.smarts = clamp(s.smarts + rng.int(0, 1))
  s.happiness = clamp(s.happiness + rng.int(-3, 3))

  // relationship drift: neglected people cool off slowly
  for (const p of life.people) if (p.alive && p.kind !== 'pet') p.relationship = clamp(p.relationship - rng.int(0, 2))

  // family mortality (simple)
  for (const p of life.people) {
    if (!p.alive || p.kind === 'pet') continue
    const risk = p.age < 60 ? 0.002 : p.age < 75 ? 0.02 : p.age < 90 ? 0.08 : 0.25
    if (rng.chance(risk)) {
      p.alive = false
      life.diary.push({ age: life.age, kind: 'info', text: 'diary.personDied', params: { name: p.firstName, kind: p.kind, age: p.age } })
      s.happiness = clamp(s.happiness - (p.relationship > 60 ? 15 : 5))
    }
  }

  // own mortality
  const base = life.age < 50 ? 0.001 : life.age < 70 ? 0.01 : life.age < 85 ? 0.05 : 0.15
  const healthMod = (100 - s.health) / 100
  if (rng.chance(base * (0.5 + healthMod * 1.5)) || (s.health <= 0 && rng.chance(0.6))) {
    life.alive = false
    life.causeOfDeath = s.health < 30 ? 'death.illness' : life.age > 80 ? 'death.oldAge' : 'death.sudden'
    life.diary.push({ age: life.age, kind: 'death', text: life.causeOfDeath })
    life.rngCalls = rng.calls
    return
  }

  life.diary.push({ age: life.age, kind: 'milestone', text: 'diary.birthday', params: { age: life.age } })

  // event roll: ~1.4 events per year on average, min 1 in childhood
  const nEvents = life.age < 18 ? 1 : rng.chance(0.75) ? 1 : 0
  if (nEvents) {
    const ev = pickEvent(ALL_EVENTS, life, rng)
    if (ev) {
      const person = pickPerson(ev, life, rng)
      life.pending = { eventId: ev.id, personId: person?.id }
      life.seenEvents.push(ev.id)
    }
  }
  life.rngCalls = rng.calls
}

/** Resolve the pending event with the chosen option. Returns the outcome id, if a random one was rolled. */
export function chooseOption(life: Life, choiceId: string): string | undefined {
  const pend = life.pending
  if (!pend) return
  const ev = EVENT_BY_ID[pend.eventId]
  const choice = ev?.choices.find((c) => c.id === choiceId)
  if (!choice) return
  const rng = rngFor(life)
  const person = life.people.find((p) => p.id === pend.personId)
  let outcomeId: string | undefined
  if (choice.outcomes?.length) {
    const out = rng.weighted(choice.outcomes, (o) => o.weight)!
    outcomeId = out.id
    applyEffects(life, out.effects, person)
  } else {
    applyEffects(life, choice.effects, person)
  }
  life.diary.push({
    age: life.age,
    kind: life.alive ? 'event' : 'death',
    text: `event:${ev.id}:${choiceId}${outcomeId ? ':' + outcomeId : ''}`,
    params: { name: person?.firstName ?? '' },
  })
  life.pending = null
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
