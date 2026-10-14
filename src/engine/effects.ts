import type { Effects, Life, Person, Stats } from './types'
import { clamp, kill, log, uid } from './util'
import { Rng } from './rng'
import { JOB_BY_ID } from './systems'
import { makePerson } from './people'
import { dateGender } from './relationships'
import { resolveArrest, imprison, type LawyerChoice } from './prison'
import { discharge, enlist } from './military'

const STAT_KEYS: (keyof Stats)[] = ['happiness', 'health', 'smarts', 'looks']

/** Mutates `life` in place (call inside an Immer producer or on a fresh copy). */
export function applyEffects(life: Life, fx: Effects | undefined, person: Person | undefined, rng: Rng) {
  if (!fx) return
  for (const k of STAT_KEYS) {
    const d = fx[k]
    if (d) life.stats[k] = clamp(life.stats[k] + d)
  }
  if (fx.karma) life.karma = clamp(life.karma + fx.karma, -100, 100)
  if (fx.money) life.money = Math.round(life.money + fx.money)
  if (fx.flags) {
    for (const [k, v] of Object.entries(fx.flags)) {
      if (!handleSpecialFlag(life, k, v, person, rng)) {
        if (v === false) delete life.flags[k]
        else life.flags[k] = v
      }
    }
  }
  if (fx.relationship && person) {
    person.relationship = clamp(person.relationship + fx.relationship)
  }
  if (fx.death) kill(life, fx.death.includes('.') ? fx.death : `death.${fx.death}`)
}

/**
 * Flags that content packs use to poke game systems. Returns true when the flag was
 * consumed (not stored on life.flags).
 */
function handleSpecialFlag(life: Life, key: string, value: boolean | number | string, person: Person | undefined, rng: Rng): boolean {
  const n = typeof value === 'number' ? value : 0
  switch (key) {
    // ---- work
    case 'performance':
      if (life.job) life.job.performance = clamp(life.job.performance + n)
      return true
    case 'fired':
      if (life.job) { log(life, 'bad', 'work.fired', { title: jobTitleKey(life) }); life.job = null; life.flags.just_fired = true }
      return true
    case 'raise':
      if (life.job) { life.job.salary = Math.round(life.job.salary * (1 + n)); log(life, 'good', 'work.raise', { pct: Math.round(n * 100) }) }
      return true
    case 'promoted':
      if (life.job) promote(life)
      return true
    case 'accept_offer': {
      const trackId = String(life.flags.offer_track ?? '')
      const track = JOB_BY_ID[trackId]
      if (track) {
        life.job = { trackId, rung: Number(life.flags.offer_rung) || 0, yearsInTrack: 0, performance: 55, salary: Number(life.flags.offer_salary) || track.ladder[0].salary }
        life.flags.ever_worked = true; life.retired = false
        log(life, 'good', 'work.hired', { title: jobTitleKey(life) })
      }
      delete life.flags.offer_track; delete life.flags.offer_rung; delete life.flags.offer_salary
      return true
    }
    case 'funeral_plan': { life.money -= 5_000; life.stats.happiness = clamp(life.stats.happiness + 4); for (const x of life.people) if (x.kind === 'sibling' && x.alive) x.relationship = clamp(x.relationship + 8); return true }
    case 'funeral_skip': { for (const x of life.people) if (x.kind === 'sibling' && x.alive) x.relationship = clamp(x.relationship - 15); life.karma = clamp(life.karma - 4, -100, 100); return true }
    case 'lawyer': { const r = resolveArrest(life, String(value) as LawyerChoice, rng); life.flags.last_arrest = r; return true }
    case 'keep_baby': { addChild(life, rng); delete life.flags.pending_baby; return true }
    case 'end_pregnancy': { delete life.flags.pending_baby; life.stats.happiness = clamp(life.stats.happiness - 6); return true }
    case 'conscript_serve': { enlist(life, 'army', true); return true }
    case 'conscript_dodge': { if (rng.chance(0.5)) { life.convictions++; imprison(life, 'draft_dodging', 1) } else log(life, 'info', 'military.dodged'); return true }
    case 'deploy': { life.flags.deploy_now = true; return true }
    case 'deploy_refuse': { if (life.military) { life.military.rank = Math.max(0, life.military.rank - 1); life.stats.happiness = clamp(life.stats.happiness - 5); log(life, 'bad', 'military.refused') } return true }
    case 'sponsor_accept': { const pay = Number(life.flags.sponsor_pay) || 0; life.money += pay; if (rng.chance(0.1)) { life.fame = clamp(life.fame - 10); log(life, 'bad', 'fame.sponsorScandal') } else log(life, 'good', 'fame.sponsorPaid', { money: pay }); delete life.flags.sponsor_pay; return true }
    case 'sponsor_decline': { delete life.flags.sponsor_pay; return true }
    case 'award_attend': { if (rng.chance(0.35 + life.fame / 300)) { life.fame = clamp(life.fame + 10); life.money += 100_000; life.flags.count_awards = (Number(life.flags.count_awards) || 0) + 1; log(life, 'good', 'fame.awardWon') } else log(life, 'info', 'fame.awardLost'); return true }
    case 'paternity_test': { life.money -= 400; if (person && rng.chance(0.12)) { log(life, 'bad', 'people.notYours', { name: person.firstName }); const partner = life.people.find((p) => (p.kind === 'partner' || p.kind === 'spouse') && p.alive); if (partner) partner.relationship = clamp(partner.relationship - 35) } else log(life, 'good', 'people.yours', { name: person?.firstName ?? '' }); return true }
    case 'prison_time_off': if (life.prison) life.prison.yearsLeft = Math.max(0, life.prison.yearsLeft - n); return true
    case 'solitary': life.stats.health = clamp(life.stats.health - 6); life.stats.happiness = clamp(life.stats.happiness - 10); return true
    case 'gang_member': if (life.prison) life.prison.gang = Boolean(value); if (value) life.flags.gang_member = true; else delete life.flags.gang_member; return true
    case 'deployment_injury': life.stats.health = clamp(life.stats.health - n); return true
    case 'medal': life.flags.medal = true; life.fame = clamp(life.fame + 4); life.karma = clamp(life.karma + 4, -100, 100); return true
    case 'discharge': discharge(life, true); return true
    case 'court_martial': discharge(life, false); life.convictions++; imprison(life, 'desertion', 2); return true
    case 'commute_sentence': if (life.prison?.deathRow) { life.prison.deathRow = false; life.prison.yearsLeft = 25 } return true
    case 'executed': kill(life, 'death.executed'); return true
    case 'hero': life.flags.hero = true; life.karma = clamp(life.karma + 10, -100, 100); return true
    case 'decline_offer':
      delete life.flags.offer_track; delete life.flags.offer_rung; delete life.flags.offer_salary
      return true
    // ---- school
    case 'grades_boost': life.education.grades = clamp(life.education.grades + 10 * (n || 1)); return true
    case 'grades_drop': life.education.grades = clamp(life.education.grades - 10 * (n || 1)); return true
    case 'suspended': life.education.grades = clamp(life.education.grades - 15); life.flags.suspended = true; return true
    case 'honors': life.flags.honors = true; life.education.grades = clamp(life.education.grades + 10); return true
    case 'dropped_out':
      if (life.education.stage === 'university' || life.education.stage === 'grad') {
        life.education.stage = 'done'; life.education.dropped = true; log(life, 'bad', 'school.droppedOut')
      }
      return true
    // ---- relationships
    case 'breakup':
      if (person && (person.kind === 'partner' || person.kind === 'spouse')) breakup(life, person)
      return true
    case 'divorce':
      if (person?.kind === 'spouse') breakup(life, person)
      return true
    case 'propose':
      if (person?.kind === 'partner') marry(life, person)
      return true
    case 'affair':
      life.flags.cheated = true
      if (person) person.relationship = clamp(person.relationship - 25)
      return true
    case 'new_child': addChild(life, rng); return true
    case 'new_friend': {
      const f = makePerson(rng, life.countryCode, 'friend', { age: life.age + rng.int(-3, 3), relationship: rng.int(55, 80) })
      life.people.push(f); log(life, 'good', 'people.newFriend', { name: f.firstName }); return true
    }
    case 'lose_friend':
      if (person?.kind === 'friend') { life.people = life.people.filter((p) => p.id !== person.id); log(life, 'bad', 'people.lostFriend', { name: person.firstName }) }
      return true
    case 'new_partner': {
      if (life.people.some((p) => (p.kind === 'partner' || p.kind === 'spouse') && p.alive)) return true
      const p = makePerson(rng, life.countryCode, 'partner', { age: life.age + rng.int(-4, 4), relationship: rng.int(55, 80), gender: dateGender(life, rng) })
      life.people.push(p); log(life, 'good', 'people.newPartner', { name: p.firstName }); return true
    }
    // ---- fame
    case 'fame': life.fame = clamp(life.fame + n); return true
    case 'followers': { const k = 'photo'; life.social[k] = (life.social[k] ?? 0) + n; return true }
    case 'stress': if (life.job) life.job.stress = clamp((life.job.stress ?? 25) + n); return true
    case 'coworker_popularity': if (life.job) life.job.popularity = clamp((life.job.popularity ?? 50) + n); return true
    case 'popularity': life.flags.school_popularity = clamp(Number(life.flags.school_popularity ?? 40) + n); return true
    case 'best_friend': if (person?.kind === 'friend') { for (const x of life.people) x.bestFriend = false; person.bestFriend = true } return true
    case 'enemy': if (person) { person.enemy = Boolean(value); if (value) person.relationship = clamp(person.relationship - 30) } return true
    case 'ailment': if (typeof value === 'string') { life.flags.ailment = value; log(life, 'bad', 'health.ailment', { ailment: value }) } return true
    case 'cured': if (life.flags.ailment) { log(life, 'good', 'health.cured', { ailment: String(life.flags.ailment) }); delete life.flags.ailment } return true
    case 'depressed': if (value) life.flags.depressed = true; else delete life.flags.depressed; return true
    case 'car_damage': { const car = life.assets.find((a) => a.kind === 'car'); if (car) { car.condition = clamp(car.condition - n); if (life.insurance.car) { life.money += Math.round(car.value * n / 100 * 0.8); log(life, 'info', 'assets.insurancePaid') } } return true }
    case 'house_damage': { const h = life.assets.find((a) => a.kind === 'house'); if (h) { const loss = Math.round(h.value * n / 100); h.value -= loss; if (life.insurance.home && loss > 0) { life.money += Math.round(loss * 0.8); log(life, 'info', 'assets.insurancePaid') } } return true }
    case 'pet_sick': if (person?.kind === 'pet') person.sick = true; return true
    case 'pet_dies': if (person?.kind === 'pet') { person.alive = false; life.stats.happiness = clamp(life.stats.happiness - 25); log(life, 'bad', 'assets.petDied', { name: person.firstName }) } return true
    case 'child_grades': if (person?.kind === 'child') person.smarts = clamp((person.smarts ?? 50) + n); return true
    case 'child_leaves': if (person?.kind === 'child') { person.movedOut = true; log(life, 'info', 'people.childMovedOut', { name: person.firstName }) } return true
    case 'survived_illness': life.flags.survived_illness = true; return true
    case 'referral': life.flags.referral = true; return true
    case 'book_deal': {
      const pay = Math.round(50_000 + (life.fame / 100) * 1_950_000)
      life.money += pay; log(life, 'good', 'fame.bookDeal', { money: pay }); return true
    }
    case 'scandal': life.fame = clamp(life.fame - 20); life.flags.scandal = true; return true
    // ---- royalty
    case 'royal_popularity': life.royalty.popularity = clamp(life.royalty.popularity + n); return true
    case 'abdicate':
      if (life.royalty.rank === 'monarch') { life.royalty.rank = 'royal'; log(life, 'info', 'royal.abdicated') }
      return true
    case 'execute_order':
      life.karma = clamp(life.karma - 30, -100, 100)
      life.royalty.popularity = clamp(life.royalty.popularity + rng.int(-25, 10))
      return true
    case 'exiled':
      life.royalty.rank = 'none'; life.flags.exiled = true; log(life, 'bad', 'royal.exiled'); return true
    // ---- mafia
    case 'mafia':
      if (value && !life.mafia) { life.mafia = { rank: 0, respect: 20 }; log(life, 'info', 'mafia.joined') }
      return true
    case 'mafia_respect': if (life.mafia) life.mafia.respect = clamp(life.mafia.respect + n); return true
    case 'mafia_promote': if (life.mafia && life.mafia.rank < 5) { life.mafia.rank++; log(life, 'good', 'mafia.promoted', { rank: life.mafia.rank }) } return true
    case 'whacked': kill(life, 'death.whacked'); return true
    case 'turn_informant':
      life.flags.informant = true; life.mafia = null; life.flags.witness_protection = true; log(life, 'info', 'mafia.informant'); return true
    // ---- business
    case 'business_value': if (life.business) life.business.value = Math.max(0, Math.round(life.business.value * (1 + n))); return true
    case 'business_bankrupt':
      if (life.business) { log(life, 'bad', 'business.bankrupt', { name: life.business.name }); life.business = null }
      return true
    case 'lawsuit': life.money -= n; log(life, 'bad', 'business.lawsuit', { money: n }); return true
    // ---- sports
    case 'injury':
      life.stats.health = clamp(life.stats.health - n); if (life.job) life.job.performance = clamp(life.job.performance - n); return true
    case 'championship':
      life.money += 2_000_000; life.fame = clamp(life.fame + 25); log(life, 'good', 'sports.championship'); return true
    case 'doping_caught':
      life.fame = clamp(life.fame - 40); life.job = null; life.flags.doping = true; log(life, 'bad', 'sports.doping'); return true
    // ---- astronaut / agent
    case 'mission_success':
      life.fame = clamp(life.fame + 10); life.flags.missions = (Number(life.flags.missions) || 0) + 1; return true
    case 'mission_failure': life.flags.failed_mission = true; return true
    case 'astronaut_fame': life.fame = clamp(life.fame + n); return true
    case 'cover_blown':
      life.flags.cover_blown = true; delete life.flags.agent; delete life.flags.agent_senior; life.job = null; log(life, 'bad', 'agent.coverBlown'); return true
    case 'agent_promote': life.flags.agent_senior = true; if (life.job) promote(life); return true
    // ---- vices
    case 'addicted':
      if (value) { if (!life.flags.addicted) log(life, 'bad', 'vice.hooked'); life.flags.addicted = true } else { if (life.flags.addicted) log(life, 'good', 'vice.clean'); delete life.flags.addicted }
      return true
    case 'std':
      life.flags.std = true; life.stats.health = clamp(life.stats.health - 6); return true
    // ---- prison
    case 'parole':
      if (life.prison) { log(life, 'good', 'prison.paroled'); release(life) }
      return true
    case 'sentence_extra':
      if (life.prison) { life.prison.yearsLeft += n; log(life, 'bad', 'prison.extended', { years: n }) }
      return true
    case 'escaped_prison':
      if (life.prison) { life.prison = null; life.flags.escaped_prison = true; life.flags.fugitive = true; log(life, 'info', 'prison.escaped') }
      return true
    default:
      return false
  }
}

// ---- shared helpers used by several systems ---------------------------------

export function jobTitleKey(life: Life) {
  if (!life.job) return ''
  return `${life.job.trackId}.${JOB_BY_ID[life.job.trackId]?.ladder[life.job.rung]?.id ?? ''}`
}

export function promote(life: Life) {
  const job = life.job
  if (!job) return
  const track = JOB_BY_ID[job.trackId]
  if (!track || job.rung >= track.ladder.length - 1) return
  job.rung++
  job.salary = track.ladder[job.rung].salary
  job.yearsInTrack = 0
  job.performance = clamp(job.performance - 10)
  life.stats.happiness = clamp(life.stats.happiness + 8)
  log(life, 'good', 'work.promoted', { title: jobTitleKey(life) })
}

export function breakup(life: Life, person: Person) {
  person.engaged = false
  const wasSpouse = person.kind === 'spouse'
  person.kind = 'ex'
  person.relationship = clamp(person.relationship - 30)
  life.stats.happiness = clamp(life.stats.happiness - (wasSpouse ? 15 : 8))
  if (wasSpouse) {
    // divorce splits net worth (cash + assets) if no prenup
    const worth = life.money + life.assets.reduce((s, a) => s + a.value - a.mortgage, 0)
    if (!life.flags.prenup && worth > 0) {
      const half = Math.round(worth / 2)
      life.money -= half
      log(life, 'bad', 'people.divorced', { name: person.firstName, money: half })
    } else log(life, 'bad', 'people.divorcedPrenup', { name: person.firstName })
    life.flags.divorced = true
    // alimony to the lower earner, child support if the kids go with them
    const mine = (life.job?.salary ?? 0) + life.pension
    const theirs = person.income ?? 0
    if (mine > theirs * 1.5 && mine > 30_000) { life.flags.alimony_amt = Math.round((mine - theirs) * 0.2); life.flags.alimony_years = 5; log(life, 'bad', 'people.alimony', { money: life.flags.alimony_amt }) }
    const kids = life.people.filter((p) => p.kind === 'child' && p.alive && p.age < 18)
    if (kids.length && Math.random() < 0.5) { for (const k of kids) k.movedOut = true; life.flags.child_support = true; log(life, 'bad', 'people.custodyLost') }
    life.people = life.people.filter((p) => p.kind !== 'in_law')
  } else log(life, 'bad', 'people.brokeUp', { name: person.firstName })
}

export function marry(life: Life, person: Person, rng: Rng = new Rng(life.seed + 'm' + life.marriages)) {
  person.kind = 'spouse'
  person.yearsTogether = 0
  person.relationship = clamp(person.relationship + 10)
  life.marriages++
  life.stats.happiness = clamp(life.stats.happiness + 15)
  // the wedding costs money; the spouse brings their savings into the marriage
  const wedding = Math.min(8_000, Math.max(1_500, Math.round(life.money * 0.08)))
  const dowry = person.money ?? Math.round((person.income ?? 30_000) * (1.5 + (person.age - 18) * 0.1))
  life.money += dowry - wedding
  // the in-laws arrive with the marriage
  for (const g of ['female', 'male'] as const) life.people.push(makePerson(rng, life.countryCode, 'in_law', { gender: g, lastName: person.lastName, age: person.age + rng.int(22, 35), relationship: rng.int(35, 75) }))
  log(life, 'good', 'people.married', { name: person.firstName })
  log(life, 'info', 'people.weddingCost', { money: wedding, dowry })
}

export function addChild(life: Life, rng: Rng, partner?: Person) {
  const other = partner ?? life.people.find((p) => (p.kind === 'spouse' || p.kind === 'partner') && p.alive)
  const child = makePerson(rng, life.countryCode, 'child', { age: 0, lastName: life.lastName, relationship: rng.int(70, 95) })
  life.people.push(child)
  life.stats.happiness = clamp(life.stats.happiness + 10)
  log(life, 'good', 'people.newChild', { name: child.firstName, other: other?.firstName ?? '' })
  return child
}

export function release(life: Life) {
  if (!life.prison) return
  life.prisonYears += life.prison.served
  life.prison = null
}

export { uid }
