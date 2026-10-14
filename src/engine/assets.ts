import type { Life, OwnedAsset } from './types'
import type { Rng } from './rng'
import { ASSET_BY_ID } from './systems'
import { makePerson } from './people'
import { clamp, log, uid } from './util'

export function netWorth(life: Life) {
  return life.money + life.assets.reduce((s, a) => s + a.value - a.mortgage, 0) + (life.business?.value ?? 0)
}

export function buyAsset(life: Life, assetId: string, withMortgage = false): boolean {
  const def = ASSET_BY_ID[assetId]
  if (!def || def.kind === 'pet' || life.prison) return false
  const down = withMortgage && def.kind === 'house' ? Math.round(def.price * 0.2) : def.price
  if (life.money < down) return false
  if (life.age < 18) return false
  life.money -= down
  const asset: OwnedAsset = {
    id: uid('a'),
    assetId,
    kind: def.kind,
    value: def.price,
    condition: 100,
    mortgage: withMortgage && def.kind === 'house' ? def.price - down : 0,
    boughtAt: life.age,
  }
  life.assets.push(asset)
  life.stats.happiness = clamp(life.stats.happiness + (def.happiness ?? 3))
  if (def.looks) life.stats.looks = clamp(life.stats.looks + def.looks)
  log(life, 'good', 'assets.bought', { item: assetId, money: def.price })
  return true
}

export function sellAsset(life: Life, ownedId: string): boolean {
  const i = life.assets.findIndex((a) => a.id === ownedId)
  if (i < 0) return false
  const a = life.assets[i]
  const proceeds = Math.round(a.value * (0.85 + a.condition / 1000)) - a.mortgage
  life.money += proceeds
  life.assets.splice(i, 1)
  log(life, 'info', 'assets.sold', { item: a.assetId, money: proceeds })
  return true
}

export function adoptPet(life: Life, petId: string, rng: Rng): boolean {
  const def = ASSET_BY_ID[petId]
  if (!def || def.kind !== 'pet' || life.money < def.price || life.prison) return false
  if (life.age < 6) return false
  life.money -= def.price
  const pet = makePerson(rng, life.countryCode, 'pet', { age: 0, relationship: rng.int(60, 90), species: petId, lastName: '' })
  life.people.push(pet)
  life.stats.happiness = clamp(life.stats.happiness + (def.happiness ?? 5))
  log(life, 'good', 'assets.adoptedPet', { name: pet.firstName, species: petId })
  return true
}

/** Yearly: upkeep, mortgage payments, value drift, pet aging. */
export function assetsYear(life: Life, rng: Rng) {
  for (const a of life.assets) {
    const def = ASSET_BY_ID[a.assetId]
    if (!def) continue
    life.money -= def.upkeep
    if (a.mortgage > 0) {
      const payment = Math.min(a.mortgage, Math.round(def.price * 0.8 / 30 * 1.05))
      life.money -= payment
      a.mortgage -= payment
      if (a.mortgage <= 0) { a.mortgage = 0; log(life, 'good', 'assets.mortgagePaid', { item: a.assetId }) }
    }
    if (a.kind === 'house') a.value = Math.round(a.value * (1 + rng.int(-2, 7) / 100))
    else if (a.kind === 'car') { a.value = Math.round(a.value * 0.88); a.condition = clamp(a.condition - rng.int(3, 9)) }
    else a.value = Math.round(a.value * (1 + rng.int(-5, 8) / 100))
  }
  // landlord: every home beyond the one you live in brings rent (4% of value, minus wear)
  const homes = life.assets.filter((a) => a.kind === 'house')
  if (homes.length > 1) {
    const rent = homes.slice(1).reduce((s, h) => s + Math.round(h.value * 0.04), 0)
    life.money += rent
    log(life, 'good', 'assets.rent', { money: rent, n: homes.length - 1 })
  }
  for (const p of life.people) {
    if (p.kind !== 'pet' || !p.alive) continue
    const def = ASSET_BY_ID[p.species ?? '']
    const lifespan = def?.lifespan ?? 12
    if (def) life.money -= def.upkeep
    if (p.age >= lifespan * 0.7 && rng.chance((p.age - lifespan * 0.7) / lifespan + 0.1)) {
      p.alive = false
      life.stats.happiness = clamp(life.stats.happiness - 10)
      log(life, 'bad', 'assets.petDied', { name: p.firstName })
    }
  }
  // bankruptcy flag for ribbons
  if (life.money < -50_000) life.flags.bankrupt = true
}
