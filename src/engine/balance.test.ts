import { describe, it } from 'vitest'
import { ageUp, chooseOption, createLife, withRng } from './life'
import { EVENT_BY_ID } from './content'
import { Rng } from './rng'
import { applyForJob } from './jobs'
import { netWorth } from './assets'

/** Economy snapshot: a "normal" life that takes the first job it can and answers events randomly. */
describe('balance report', () => {
  it('prints net worth distribution (informational)', () => {
    const worths: number[] = []
    const ages: number[] = []
    for (let i = 0; i < 60; i++) {
      const life = createLife({ seed: `bal-${i}` })
      const pick = new Rng('p' + i)
      let guard = 0
      while (life.alive && guard++ < 200) {
        ageUp(life)
        if (life.pending) chooseOption(life, pick.pick(EVENT_BY_ID[life.pending.eventId].choices).id)
        withRng(life, (rng) => { if (!life.job && life.jobBoard.length && life.age >= 18) applyForJob(life, pick.pick(life.jobBoard), rng) })
      }
      worths.push(netWorth(life)); ages.push(life.age)
    }
    worths.sort((a, b) => a - b)
    const q = (p: number) => Math.round(worths[Math.floor(p * (worths.length - 1))])
    console.log(`net worth at death: p10=${q(0.1)} p50=${q(0.5)} p90=${q(0.9)} max=${q(1)} | avg age ${Math.round(ages.reduce((a, b) => a + b) / ages.length)}`)
  })
})
