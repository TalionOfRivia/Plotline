import type { Life } from './types'
import { RIBBONS } from './systems'
import { netWorth } from './assets'

export function awardRibbon(life: Life): string {
  const kids = life.people.filter((p) => p.kind === 'child').length
  const events = life.diary.filter((d) => d.kind === 'event').length
  const worth = netWorth(life)
  for (const r of RIBBONS) {
    const w = r.when ?? {}
    if (w.minMoney !== undefined && worth < w.minMoney) continue
    if (w.maxMoney !== undefined && worth > w.maxMoney) continue
    if (w.minAge !== undefined && life.age < w.minAge) continue
    if (w.maxAge !== undefined && life.age > w.maxAge) continue
    if (w.minKids !== undefined && kids < w.minKids) continue
    if (w.minCrimes !== undefined && life.crimes + life.convictions < w.minCrimes) continue
    if (w.minPrisonYears !== undefined && life.prisonYears < w.minPrisonYears) continue
    if (w.minMarriages !== undefined && life.marriages < w.minMarriages) continue
    if (w.maxEvents !== undefined && events > w.maxEvents) continue
    if (w.famous && life.fame < 50) continue
    if (w.royal && life.royalty.rank === 'none') continue
    if (w.flags && !w.flags.every((f) => Boolean(life.flags[f]))) continue
    if (w.notFlags && w.notFlags.some((f) => Boolean(life.flags[f]))) continue
    return r.id
  }
  return 'mediocre'
}
