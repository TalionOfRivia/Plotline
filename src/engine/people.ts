import namesData from '../content/names.json'
import type { Rng } from './rng'
import type { Gender, Person, RelationKind } from './types'
import { uid } from './util'

type NameEntry = string | { latin: string; native: string }
export interface Pool { female: NameEntry[]; male: NameEntry[]; last: NameEntry[] }
export interface Country { code: string; name: string; cities: string[]; currency: string; namePool: string }
export const NAMES = namesData as unknown as { countries: Country[]; pools: Record<string, Pool> }

export const latin = (n: NameEntry) => (typeof n === 'string' ? n : n.latin)

export function poolFor(countryCode: string): Pool {
  const c = NAMES.countries.find((c) => c.code === countryCode)
  return NAMES.pools[c?.namePool ?? 'en'] ?? NAMES.pools.en
}

export function randomName(rng: Rng, countryCode: string, gender: Gender) {
  const pool = poolFor(countryCode)
  return { first: latin(rng.pick(pool[gender])), last: latin(rng.pick(pool.last)) }
}

export function makePerson(rng: Rng, countryCode: string, kind: RelationKind, opts: Partial<Person> = {}): Person {
  const gender: Gender = opts.gender ?? (rng.chance(0.5) ? 'female' : 'male')
  const n = randomName(rng, countryCode, gender)
  return {
    id: uid('p'),
    firstName: n.first,
    lastName: n.last,
    gender,
    age: 30,
    kind,
    relationship: rng.bell(50, 95),
    alive: true,
    looks: rng.bell(20, 100),
    smarts: rng.bell(20, 100),
    ...opts,
  }
}
