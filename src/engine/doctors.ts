// Doctors with reputations, alternative medicine, donations.
import type { Life } from './types'
import type { Rng } from './rng'
import { clamp, log, use, used } from './util'
import { WELFARE_STATES } from './school'

export type DoctorKind = 'cheap' | 'good' | 'alternative'
export const DOCTORS: Record<DoctorKind, { cost: number; success: number; reputation: number }> = {
  cheap: { cost: 150, success: 0.55, reputation: 30 },
  good: { cost: 700, success: 0.9, reputation: 85 },
  alternative: { cost: 300, success: 0.35, reputation: 50 },
}

export type DoctorResult = { key: string; kind: 'good' | 'bad' | 'info'; money?: number }

export function seeDoctor(life: Life, which: DoctorKind, rng: Rng): DoctorResult {
  if (used(life, `doctor_${which}`) >= 2) return { key: 'activity.limit', kind: 'info' }
  const d = DOCTORS[which]
  const cost = WELFARE_STATES.has(life.countryCode) && which !== 'alternative' ? 0 : d.cost
  if (life.money < cost) return { key: 'activity.cantAfford', kind: 'bad' }
  use(life, `doctor_${which}`)
  life.money -= cost
  const ail = life.flags.ailment
  if (which === 'alternative') {
    // the witch doctor: coin flip between a miracle and a mess
    if (rng.chance(0.35)) { if (ail) { delete life.flags.ailment; log(life, 'good', 'health.cured', { ailment: String(ail) }) } life.stats.health = clamp(life.stats.health + 10); life.stats.happiness = clamp(life.stats.happiness + 6); return { key: 'doctor.altMiracle', kind: 'good' } }
    life.stats.health = clamp(life.stats.health - 6)
    return { key: 'doctor.altMess', kind: 'bad' }
  }
  if (ail) {
    if (rng.chance(d.success)) { delete life.flags.ailment; life.stats.health = clamp(life.stats.health + 8); life.stats.happiness = clamp(life.stats.happiness + 8); log(life, 'good', 'health.cured', { ailment: String(ail) }); return { key: 'health.cured', kind: 'good' } }
    log(life, 'bad', 'health.treatmentFailed', { ailment: String(ail) })
    return { key: 'health.treatmentFailed', kind: 'bad' }
  }
  life.stats.health = clamp(life.stats.health + (which === 'good' ? 5 : 2))
  if (life.stats.health < 40) life.flags.survived_illness = true
  return { key: 'doctor.checkup', kind: 'info' }
}

export function donate(life: Life, what: 'blood' | 'plasma'): DoctorResult {
  if (life.age < 18 || used(life, `donate_${what}`) >= 1 || life.stats.health < 30) return { key: 'doctor.cantDonate', kind: 'bad' }
  use(life, `donate_${what}`)
  life.stats.health = clamp(life.stats.health - 2)
  if (what === 'blood') { life.karma = clamp(life.karma + 3, -100, 100); life.stats.happiness = clamp(life.stats.happiness + 2); return { key: 'doctor.gaveBlood', kind: 'good' } }
  life.money += 60
  return { key: 'doctor.soldPlasma', kind: 'info', money: 60 }
}
