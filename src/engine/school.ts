import type { Life } from './types'
import type { Rng } from './rng'
import { EDUCATION } from './systems'
import { clamp, log, use, used } from './util'

/** Countries where public university (and healthcare) is free or near-free. */
export const WELFARE_STATES = new Set(["DK", "SE", "NO", "FI", "IS", "DE", "AT", "FR", "NL", "BE", "GB", "IE", "CA", "AU", "NZ", "IL", "ES", "IT", "PT", "CZ", "PL", "EE", "LV", "LT", "SI", "SK", "HU", "GR", "JP", "KR", "TW", "LU", "CH"])

/** Yearly school progression. */
export function schoolYear(life: Life, rng: Rng) {
  const ed = life.education
  const s = life.stats

  if (life.age === 6 && ed.stage === 'none') {
    ed.stage = 'primary'
    ed.grades = clamp(40 + s.smarts * 0.5 + rng.int(-10, 10))
    log(life, 'milestone', 'school.started')
  }
  if (ed.stage === 'primary' || ed.stage === 'high_school') {
    if (life.age === 14 && ed.stage === 'primary') { ed.stage = 'high_school'; log(life, 'milestone', 'school.highSchool') }
    // grades drift toward smarts, with noise
    const target = clamp(s.smarts * 0.8 + 15)
    ed.grades = clamp(ed.grades + (target - ed.grades) * 0.3 + rng.int(-6, 6))
    if (life.prison) return
    if (life.age === 18) {
      if (ed.grades >= 35) {
        ed.stage = 'done'
        ed.degrees.push('high_school')
        log(life, 'milestone', 'school.graduatedHS', { grades: Math.round(ed.grades) })
        life.flags.can_enroll_university = true
        s.smarts = clamp(s.smarts + 3)
      } else {
        ed.stage = 'done'
        ed.dropped = true
        log(life, 'bad', 'school.failedHS')
      }
    }
    return
  }

  if (ed.stage === 'university') {
    ed.yearsIn++
    const target = clamp(s.smarts * 0.9 + 5)
    ed.grades = clamp(ed.grades + (target - ed.grades) * 0.35 + rng.int(-8, 8))
    if (!life.flags.scholarship && !WELFARE_STATES.has(life.countryCode)) {
      const yearly = EDUCATION.universityCost / EDUCATION.universityYears
      if (life.money >= yearly) life.money -= yearly
      else ed.loans += yearly
    }
    if (ed.grades < 25 && rng.chance(0.5)) {
      ed.stage = 'done'; ed.dropped = true; log(life, 'bad', 'school.flunkedOut'); return
    }
    if (ed.yearsIn >= EDUCATION.universityYears) {
      ed.stage = 'done'
      ed.degrees.push('university')
      life.flags.graduated_university = true
      s.smarts = clamp(s.smarts + 8)
      s.happiness = clamp(s.happiness + 8)
      log(life, 'milestone', 'school.graduatedUni', { major: ed.major ?? '' , honors: ed.grades >= 85 ? 1 : 0 })
    }
    return
  }

  if (ed.stage === 'grad' && ed.gradSchool) {
    const gs = EDUCATION.gradSchools.find((g) => g.id === ed.gradSchool)!
    ed.yearsIn++
    const yearly = gs.cost / gs.years
    if (life.money >= yearly) life.money -= yearly
    else ed.loans += yearly
    if (ed.yearsIn >= gs.years) {
      ed.stage = 'done'
      ed.degrees.push(gs.id)
      s.smarts = clamp(s.smarts + 10)
      log(life, 'milestone', 'school.graduatedGrad', { school: gs.id })
    }
  }

  // loan repayment: 10% of income or 5% of balance per year once working
  if (ed.loans > 0 && life.job) {
    const pay = Math.min(ed.loans, Math.max(life.job.salary * 0.1, ed.loans * 0.05))
    life.money -= pay
    ed.loans -= pay
    if (ed.loans <= 0) { ed.loans = 0; log(life, 'good', 'school.loansPaid') }
  }
}

export function canEnrollUniversity(life: Life) {
  return life.age >= 18 && life.age <= 60 && life.education.stage === 'done' &&
    life.education.degrees.includes('high_school') && !life.education.degrees.includes('university') && !life.prison
}

export function enrollUniversity(life: Life, majorId: string, rng: Rng, funding: 'cash' | 'loan' | 'scholarship') {
  const major = EDUCATION.majors.find((m) => m.id === majorId)
  if (!major || !canEnrollUniversity(life)) return false
  if (life.stats.smarts < major.minSmarts) return false
  if (funding === 'scholarship') {
    if (life.stats.smarts < EDUCATION.scholarshipMinSmarts) return false
    life.flags.scholarship = true
  } else delete life.flags.scholarship
  life.education.stage = 'university'
  life.education.major = majorId
  life.education.yearsIn = 0
  life.education.grades = clamp(50 + life.stats.smarts * 0.4 + rng.int(-10, 10))
  if (life.job) { life.job = null }
  log(life, 'milestone', 'school.enrolledUni', { major: majorId })
  return true
}

export function gradSchoolsAvailable(life: Life) {
  if (life.education.stage !== 'done' || !life.education.degrees.includes('university') || life.prison) return []
  return EDUCATION.gradSchools.filter((g) =>
    !life.education.degrees.includes(g.id) &&
    life.stats.smarts >= g.minSmarts &&
    (g.requiresMajors.includes('any') || (life.education.major && g.requiresMajors.includes(life.education.major))))
}

export function enrollGrad(life: Life, gradId: string) {
  if (!gradSchoolsAvailable(life).some((g) => g.id === gradId)) return false
  life.education.stage = 'grad'
  life.education.gradSchool = gradId
  life.education.yearsIn = 0
  life.job = null
  log(life, 'milestone', 'school.enrolledGrad', { school: gradId })
  return true
}

export function studyHarder(life: Life) {
  if (used(life, 'study') >= 1) return
  use(life, 'study')
  life.education.grades = clamp(life.education.grades + 8)
  life.stats.happiness = clamp(life.stats.happiness - 2)
  life.stats.smarts = clamp(life.stats.smarts + 1)
}
