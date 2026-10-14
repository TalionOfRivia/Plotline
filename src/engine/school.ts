import type { Life } from './types'
import { Rng } from './rng'
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
    makeTeachers(life, rng)
    life.flags.school_popularity = rng.int(25, 60)
    ed.grades = clamp(40 + s.smarts * 0.5 + rng.int(-10, 10))
    log(life, 'milestone', 'school.started')
  }
  if (ed.stage === 'primary' || ed.stage === 'high_school') {
    if (life.age === 14 && ed.stage === 'primary') { ed.stage = 'high_school'; makeTeachers(life, rng); log(life, 'milestone', 'school.highSchool') }
    if (life.flags.private_school) { if (life.money >= PRIVATE_SCHOOL_COST) life.money -= PRIVATE_SCHOOL_COST; else delete life.flags.private_school }
    // grades drift toward smarts, with noise
    const target = clamp(s.smarts * 0.8 + 15 + (life.flags.private_school ? 10 : 0))
    ed.grades = clamp(ed.grades + (target - ed.grades) * 0.3 + rng.int(-6, 6))
    for (const t of life.teachers) t.relationship = clamp(t.relationship + rng.int(-3, 3))
    if (life.prison) return
    if (life.age === 18) {
      if (ed.grades >= 35) {
        ed.stage = 'done'
        ed.degrees.push('high_school')
        log(life, 'milestone', 'school.graduatedHS', { grades: Math.round(ed.grades) })
        life.flags.can_enroll_university = true
        if (rng.chance(0.3)) life.flags.parents_pay_offer = true
        life.teachers = []
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

export function enrollUniversity(life: Life, majorId: string, rng: Rng, funding: 'cash' | 'loan' | 'scholarship' | 'parents') {
  const major = EDUCATION.majors.find((m) => m.id === majorId)
  if (!major || !canEnrollUniversity(life)) return false
  if (!majorsOffered(life).includes(majorId)) return false
  if (funding === 'parents') { if (!parentsCanPay(life)) return false; life.flags.scholarship = true; delete life.flags.parents_pay_offer }
  if (life.stats.smarts < major.minSmarts) return false
  if (funding === 'scholarship') {
    if (life.stats.smarts < EDUCATION.scholarshipMinSmarts) return false
    life.flags.scholarship = true
  } else if (funding !== 'parents') delete life.flags.scholarship
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

// ---- teachers, popularity, private school, GED, per-life majors -------------

const SUBJECTS = ['math', 'literature', 'science', 'history', 'pe', 'art', 'music']
export function makeTeachers(life: Life, rng: Rng) {
  const pool = (() => { try { return undefined } catch { return undefined } })()
  void pool
  life.teachers = Array.from({ length: 3 }, (_, i) => ({ id: 't' + life.age + i, name: '', subject: rng.pick(SUBJECTS), relationship: rng.int(40, 70) }))
}
export type TeacherAction = 'suck_up' | 'prank' | 'ask_help'
export function teacherAction(life: Life, teacherId: string, action: TeacherAction, rng: Rng): string {
  const t = life.teachers.find((x) => x.id === teacherId)
  if (!t || used(life, 'teacher_' + teacherId) >= 1) return 'school.teacherEnough'
  use(life, 'teacher_' + teacherId)
  if (action === 'suck_up') { t.relationship = clamp(t.relationship + rng.int(5, 12)); life.education.grades = clamp(life.education.grades + 2); return 'school.teacherSuckUp' }
  if (action === 'ask_help') { life.education.grades = clamp(life.education.grades + 4); life.stats.smarts = clamp(life.stats.smarts + 1); t.relationship = clamp(t.relationship + 3); return 'school.teacherHelp' }
  if (rng.chance(0.5)) { life.flags.school_popularity = clamp(Number(life.flags.school_popularity ?? 40) + 8); t.relationship = clamp(t.relationship - 10); return 'school.prankWin' }
  t.relationship = clamp(t.relationship - 20); life.education.grades = clamp(life.education.grades - 8); return 'school.prankCaught'
}
export type PopularityAction = 'host_party' | 'be_nice' | 'show_off'
export function popularityAction(life: Life, action: PopularityAction, rng: Rng): string {
  if (used(life, 'pop_' + action) >= 1) return 'activity.limit'
  use(life, 'pop_' + action)
  const pop = Number(life.flags.school_popularity ?? 40)
  if (action === 'host_party') { if (life.money < 200) return 'activity.cantAfford'; life.money -= 200; life.flags.school_popularity = clamp(pop + rng.int(6, 14)); return 'school.partyHit' }
  if (action === 'be_nice') { life.flags.school_popularity = clamp(pop + rng.int(2, 6)); life.karma = clamp(life.karma + 2, -100, 100); return 'school.beNice' }
  if (rng.chance(0.5)) { life.flags.school_popularity = clamp(pop + rng.int(5, 10)); return 'school.showOffWin' }
  life.flags.school_popularity = clamp(pop - rng.int(5, 12)); return 'school.showOffFlop'
}
export const PRIVATE_SCHOOL_COST = 15_000
export function switchSchool(life: Life, privateSchool: boolean): boolean {
  if (life.education.stage !== 'primary' && life.education.stage !== 'high_school') return false
  if (privateSchool && life.money < PRIVATE_SCHOOL_COST) return false
  if (privateSchool) { life.money -= PRIVATE_SCHOOL_COST; life.flags.private_school = true; life.education.grades = clamp(life.education.grades + 6) }
  else delete life.flags.private_school
  return true
}
export function takeGED(life: Life, rng: Rng): boolean {
  if (life.age < 18 || life.education.degrees.includes('high_school') || life.money < 150 || used(life, 'ged') >= 1) return false
  use(life, 'ged')
  life.money -= 150
  if (rng.chance(clamp(0.4 + (life.stats.smarts - 50) / 150, 0.1, 0.95))) { life.education.degrees.push('high_school'); life.education.dropped = false; log(life, 'good', 'school.gedPassed'); return true }
  log(life, 'bad', 'school.gedFailed')
  return false
}
/** Majors offered this life (a random subset, like real admissions). */
export function majorsOffered(life: Life): string[] {
  if (!life.flags.majors_offered) {
    const rng = new Rng(life.seed + 'majors')
    const pool = EDUCATION.majors.map((m) => m.id)
    const picks = new Set<string>()
    while (picks.size < Math.min(9, pool.length)) picks.add(rng.pick(pool))
    life.flags.majors_offered = [...picks].join(',')
  }
  return String(life.flags.majors_offered).split(',')
}
export function parentsCanPay(life: Life) {
  return life.people.some((p) => (p.kind === 'mother' || p.kind === 'father') && p.alive) && Boolean(life.flags.parents_pay_offer)
}
