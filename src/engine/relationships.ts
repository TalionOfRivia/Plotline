import type { Life, Person } from './types'
import type { Rng } from './rng'
import { makePerson } from './people'
import { clamp, log } from './util'
import { addChild, breakup, marry } from './effects'

export type Interaction =
  | 'spend_time' | 'gift' | 'compliment' | 'insult' | 'ask_money' | 'flirt' | 'propose' | 'break_up'
  | 'have_child' | 'adopt' | 'prenup' | 'play' | 'walk' | 'movie_night' | 'vacation'

export const INTERACTIONS: Record<Interaction, { cost: number; kinds: Person['kind'][] | 'all'; minAge: number }> = {
  spend_time: { cost: 0, kinds: 'all', minAge: 0 },
  compliment: { cost: 0, kinds: 'all', minAge: 4 },
  insult: { cost: 0, kinds: 'all', minAge: 4 },
  gift: { cost: 100, kinds: 'all', minAge: 10 },
  ask_money: { cost: 0, kinds: ['mother', 'father', 'sibling', 'friend', 'spouse', 'partner', 'child'], minAge: 5 },
  movie_night: { cost: 40, kinds: ['friend', 'partner', 'spouse', 'sibling', 'child'], minAge: 12 },
  vacation: { cost: 3000, kinds: ['partner', 'spouse', 'child', 'friend'], minAge: 18 },
  flirt: { cost: 0, kinds: ['partner', 'spouse'], minAge: 15 },
  propose: { cost: 2000, kinds: ['partner'], minAge: 18 },
  prenup: { cost: 0, kinds: ['partner'], minAge: 18 },
  break_up: { cost: 0, kinds: ['partner', 'spouse'], minAge: 13 },
  have_child: { cost: 0, kinds: ['spouse', 'partner'], minAge: 18 },
  adopt: { cost: 12000, kinds: ['spouse', 'partner'], minAge: 21 },
  play: { cost: 0, kinds: ['pet'], minAge: 0 },
  walk: { cost: 0, kinds: ['pet'], minAge: 5 },
}

export function availableInteractions(life: Life, p: Person): Interaction[] {
  return (Object.keys(INTERACTIONS) as Interaction[]).filter((k) => {
    const d = INTERACTIONS[k]
    if (life.age < d.minAge) return false
    if (d.kinds !== 'all' && !d.kinds.includes(p.kind)) return false
    if (k === 'prenup' && life.flags.prenup) return false
    if ((k === 'have_child' || k === 'adopt') && life.age > 55) return false
    if (life.prison && !['spend_time', 'compliment', 'insult', 'break_up'].includes(k)) return false
    return true
  })
}

/** Returns a diary key describing what happened (also logged). */
export function interact(life: Life, personId: string, kind: Interaction, rng: Rng): string {
  const p = life.people.find((x) => x.id === personId && x.alive)
  if (!p) return 'people.gone'
  const d = INTERACTIONS[kind]
  if (life.money < d.cost) return 'people.cantAfford'
  life.money -= d.cost
  const warm = p.relationship / 100
  const bump = (n: number) => { p.relationship = clamp(p.relationship + n) }
  const happy = (n: number) => { life.stats.happiness = clamp(life.stats.happiness + n) }
  let key = `people.did.${kind}`
  switch (kind) {
    case 'spend_time': bump(rng.int(3, 8)); happy(2); break
    case 'compliment': if (rng.chance(0.85)) { bump(rng.int(2, 6)) } else { bump(-2); key = 'people.did.compliment_flop' } break
    case 'insult': bump(-rng.int(8, 20)); happy(rng.chance(0.5) ? 1 : -2); life.karma = clamp(life.karma - 2, -100, 100); break
    case 'gift': bump(rng.int(5, 12)); break
    case 'movie_night': bump(rng.int(4, 9)); happy(3); break
    case 'vacation': bump(rng.int(10, 20)); happy(8); break
    case 'play': case 'walk': bump(rng.int(3, 8)); happy(4); life.stats.health = clamp(life.stats.health + 1); break
    case 'ask_money': {
      const amt = p.kind === 'child' ? rng.int(20, 300) : rng.int(50, 2000) * (p.relationship > 70 ? 2 : 1)
      if (rng.chance(0.3 + warm * 0.6)) { life.money += amt; bump(-3); key = 'people.did.ask_money_yes'; log(life, 'good', key, { name: p.firstName, money: amt }); return key }
      bump(-5); key = 'people.did.ask_money_no'; break
    }
    case 'flirt': bump(rng.int(2, 7)); happy(2); break
    case 'prenup':
      if (rng.chance(0.3 + warm * 0.5)) { life.flags.prenup = true; key = 'people.did.prenup_yes' } else { bump(-10); key = 'people.did.prenup_no' }
      break
    case 'propose':
      if (rng.chance(0.2 + warm * 0.75)) { marry(life, p); return 'people.married' }
      bump(-10); happy(-8); key = 'people.did.propose_no'; break
    case 'break_up': breakup(life, p); return p.kind === 'ex' ? 'people.brokeUp' : key
    case 'have_child':
      if (rng.chance(0.55 + (life.stats.health - 50) / 300)) { addChild(life, rng, p); return 'people.newChild' }
      key = 'people.did.have_child_no'; break
    case 'adopt': addChild(life, rng, p); return 'people.newChild'
  }
  log(life, 'info', key, { name: p.firstName })
  return key
}

/** Candidate partners for the date board. */
export function refreshDateBoard(life: Life, rng: Rng) {
  if (life.age < 15) { life.dateBoard = []; return }
  const gender = life.flags.prefers_same_gender ? life.gender : life.gender === 'female' ? 'male' : 'female'
  const spread = life.age < 18 ? 1 : 6
  life.dateBoard = Array.from({ length: 4 }, () =>
    makePerson(rng, life.countryCode, 'partner', {
      age: clamp(life.age + rng.int(-spread, spread), life.age < 18 ? 15 : 18, 99),
      gender,
      relationship: rng.int(40, 70),
      income: life.age >= 18 ? rng.int(15_000, 120_000) : 0,
    }))
}

export function startDating(life: Life, candidate: Person, rng: Rng): boolean {
  if (life.people.some((p) => (p.kind === 'partner' || p.kind === 'spouse') && p.alive)) return false
  const p = 0.35 + (life.stats.looks - 50) / 150 + (life.fame / 300)
  if (!rng.chance(clamp(p, 0.1, 0.9))) { log(life, 'bad', 'people.rejected', { name: candidate.firstName }); life.dateBoard = life.dateBoard.filter((c) => c.id !== candidate.id); return false }
  life.people.push({ ...candidate, kind: 'partner' })
  life.dateBoard = []
  life.stats.happiness = clamp(life.stats.happiness + 8)
  log(life, 'good', 'people.newPartner', { name: candidate.firstName })
  return true
}

/** Yearly: friends in school, partner mood, spouse years, kids growing. */
export function relationshipsYear(life: Life, rng: Rng) {
  // make friends at school
  if (life.age >= 5 && life.age <= 22 && rng.chance(0.3) && life.people.filter((p) => p.kind === 'friend' && p.alive).length < 5) {
    const f = makePerson(rng, life.countryCode, 'friend', { age: life.age + rng.int(-2, 2), relationship: rng.int(50, 80) })
    life.people.push(f)
    log(life, 'info', 'people.newFriend', { name: f.firstName })
  }
  for (const p of life.people) {
    if (!p.alive) continue
    if (p.kind === 'spouse') {
      p.yearsTogether = (p.yearsTogether ?? 0) + 1
      if (p.relationship < 20 && rng.chance(0.35)) { breakup(life, p); continue }
    }
    if (p.kind === 'partner' && p.relationship < 25 && rng.chance(0.5)) { breakup(life, p); continue }
    if (p.kind === 'child' && p.age === 18) log(life, 'info', 'people.childGrewUp', { name: p.firstName })
  }
  // widowhood
  const deadSpouse = life.people.find((p) => p.kind === 'spouse' && !p.alive)
  if (deadSpouse) { deadSpouse.kind = 'ex'; life.flags.widowed = true }
}
