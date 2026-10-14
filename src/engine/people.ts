import namesData from '../content/names.json'
import poolsA from '../content/pools-a.json'
import poolsB from '../content/pools-b.json'
import countriesData from '../content/countries.json'
import type { Rng } from './rng'
import type { Gender, Person, RelationKind } from './types'
import { uid } from './util'

type NameEntry = string | { latin: string; native: string }
export interface Pool { female: NameEntry[]; male: NameEntry[]; last: NameEntry[] }
export interface Country {
  code: string
  name: string
  nameHe: string
  flag: string
  cities: string[]
  currency: string
  namePool: string
  monarchy: boolean
}

export const COUNTRIES = countriesData as Country[]
export const COUNTRY_BY_CODE: Record<string, Country> = Object.fromEntries(COUNTRIES.map((c) => [c.code, c]))
export const POOLS: Record<string, Pool> = {
  ...(namesData as unknown as { pools: Record<string, Pool> }).pools,
  ...(poolsA as Record<string, Pool>),
  ...(poolsB as Record<string, Pool>),
}

/** Kept for older imports; countries now live in countries.json. */
export const NAMES = { countries: COUNTRIES, pools: POOLS }

export const latin = (n: NameEntry) => (typeof n === 'string' ? n : n.latin)

export function countryName(code: string, lang: string) {
  const c = COUNTRY_BY_CODE[code]
  if (!c) return code
  return lang === 'he' ? c.nameHe || c.name : c.name
}

export function poolFor(countryCode: string): Pool {
  const c = COUNTRY_BY_CODE[countryCode]
  return POOLS[c?.namePool ?? 'en'] ?? POOLS.en
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
